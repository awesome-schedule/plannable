/**
 * @module src/store
 */

/**
 *
 */
import { SemesterJSON } from '@/models/Catalog';
import { SemesterStorage } from '.';
import axios from 'axios';
import { backend } from '@/config';
import Vue from 'vue';
import { NotiMsg } from './notification';

interface BackendBaseRequest {
    username: string;
    credential: string;
}

interface BackendBaseResponse {
    /** true if success, false otherwise */
    success: boolean;
    /** reason for failure. If success, can put anything here */
    message: string;
}

interface BackendListRequest extends BackendBaseRequest {
    name: string; // the profile name. If omitted, return all the profiles (each profile should be the latest version)
    version?: number; // only present if "name" is present. If this field is missing, then the latest profile should be returned
}

interface ProfileVersion {
    /** number of milliseconds since Unix epoch */
    modified: number;
    /** User Agent from the Http Header */
    userAgent: string;
    /** the version number */
    version: number;
}

interface BackendListResponse extends BackendBaseResponse {
    /** if the name field of the request is missing, this should be a list of all profiles. Otherwise, this should be a list of 1 profile corresponding to the name and version given. */
    profiles: {
        /** keys of all historical versions for this profile. They can be used as the "version" field to query historical profiles */
        versions: ProfileVersion[];
        /** the body of the profile corresponding to the queried version. It should be the latest profile if the version number is missing */
        profile: string;
    }[];
}

interface BackendProfile {
    /** name of the profile */
    name: string;
    /** content of the profile */
    profile: string;
    /** whether to force create a new version for this file. If this field is false or is not present, then it is up to the server to decide whether to create a new version */
    new?: true;
}

interface BackendUploadRequest extends BackendBaseRequest {
    /** list of profiles to be uploaded */
    profiles: BackendProfile[];
}

interface BackendUploadResponse extends BackendBaseResponse {
    /** version information of each newly uploaded profile. If failed, this field is not present */
    versions: ProfileVersion[][];
}

interface BackendRenameRequest extends BackendBaseRequest {
    action: 'rename';
    oldName: string;
    newName: string;
    profile: string;
}

interface BackendRenameResponse extends BackendBaseResponse {
    versions: ProfileVersion[];
}

interface BackendDeleteRequest extends BackendBaseRequest {
    action: 'delete';
    /** the name of the profile to be deleted */
    name: string;
}

interface BackendDeleteResponse extends BackendBaseResponse {}

/**
 * the profile class handles profiles adding, renaming and deleting
 * @note profile selection is handled in the [[Store]] class
 * because it also needs to manipulate other store modules
 * @author Hanzhi Zhou
 */
class Profile {
    /**
     * a reactive property. whenever changed, the `currentProfile` in the `localStorage` will be updated
     */
    current: string;
    /**
     * an array of local profile names and their associated information
     */
    profiles: {
        name: string;
        remote: boolean;
        versions: ProfileVersion[];
        currentVersion: number;
    }[];
    canSync: boolean;

    constructor() {
        this.current = localStorage.getItem('currentProfile') || '';
        const profiles: any[] = JSON.parse(localStorage.getItem('profiles') || '[]') || [];
        if (profiles.length === 0) this.profiles = profiles;
        else {
            if (typeof profiles[0] === 'string')
                this.profiles = profiles.map(p => this.createProfile(p));
            else if (typeof profiles[0] === 'object') {
                this.profiles = profiles;
            } else {
                console.error('unknown profile format');
                this.profiles = [];
            }
        }
        const [_u, _c] = this._cre();
        this.canSync = !!_u && !!_c;
    }

    /**
     * initialize profile storage if it does not exist already
     */
    initProfiles(semesters: SemesterJSON[]) {
        if (!semesters.length) return;

        const name = localStorage.getItem('currentProfile');
        const profiles = [];
        if (!name) {
            // backward compatibility
            for (const sem of semesters.concat().reverse()) {
                const oldData = localStorage.getItem(sem.id);
                if (oldData) {
                    let parsed: Partial<SemesterStorage> | null = null;
                    try {
                        parsed = JSON.parse(oldData);
                    } catch (e) {
                        console.error(e);
                    }
                    if (parsed) {
                        parsed.name = sem.name;
                        localStorage.removeItem(sem.id);
                        localStorage.setItem(sem.name, JSON.stringify(parsed));
                        profiles.push(sem.name);
                    }
                }
            }

            // latest semester
            const latest = semesters[0].name;
            if (!profiles.includes(latest)) profiles.push(latest);

            this.current = latest;
            this.profiles = profiles.map(p => this.createProfile(p));
        }
    }

    createProfile(name: string) {
        return {
            name,
            remote: false,
            versions: [],
            currentVersion: -1
        };
    }

    /**
     * rename a profile.
     * note that name duplication is not checked! This check is done in [[ExportView.finishEdit]]
     * @param idx
     * @param oldName
     * @param newName
     * @param raw
     */
    async renameProfile(idx: number, oldName: string, newName: string, raw: string) {
        if (oldName === this.current) this.current = newName;

        const parsed = JSON.parse(raw);
        parsed.name = newName;
        localStorage.removeItem(oldName);

        const newProf = JSON.stringify(parsed);
        localStorage.setItem(newName, newProf);

        this.profiles[idx].name = newName;

        if (this.canSync && this.profiles[idx].remote) {
            const [username, credential] = this._cre();
            const request: BackendRenameRequest = {
                username,
                credential,
                action: 'rename',
                oldName,
                newName,
                profile: newProf
            };
            console.log(request);
            const { data: resp } = await axios.post<BackendRenameResponse>(backend.edit, request);
            if (!resp.success) {
                this.logout();
                return {
                    msg: `Failed to communicate with ${backend.name}: ${resp.message}. Please try to re-login from ${backend.name}.`,
                    level: 'error'
                } as const;
            }

            this.profiles[idx].versions = resp.versions.sort((a, b) => b.version - a.version);
            this.profiles[idx].currentVersion = resp.versions[0].version;
        }
    }

    async deleteRemote(name: string) {
        const [username, credential] = this._cre();
        const request: BackendDeleteRequest = {
            username,
            credential,
            action: 'delete',
            name
        };
        const { data: resp } = await axios.post<BackendDeleteResponse>(backend.edit, request);
        return resp;
    }

    /**
     * delete a profile
     * @param name
     * @param idx
     * @returns the name of the previous profile if the deleted profile is selected,
     * returns undefined otherwise
     */
    async deleteProfile(name: string, idx: number, requestRemote = true) {
        const msg: NotiMsg<string> = {
            msg: '',
            level: 'success'
        };
        if (this.canSync && this.profiles[idx].remote && requestRemote) {
            const resp = await this.deleteRemote(name);
            if (!resp.success) {
                if (resp.message === "Profile doesn't exist") {
                    msg.level = 'warn';
                    msg.msg = `Profile ${name} is already deleted from ${backend.name}! The deletion is probably requested by another device`;
                } else {
                    this.logout();
                    msg.level = 'error';
                    msg.msg = `Failed to communicate with ${backend.name}: ${resp.message}. Please try to re-login from ${backend.name}.`;
                }
            }
        }

        this.profiles.splice(idx, 1);
        localStorage.removeItem(name);

        if (name === this.current) {
            if (idx === this.profiles.length) {
                msg.payload = this.current = this.profiles[idx - 1].name;
            } else {
                msg.payload = this.current = this.profiles[idx].name;
            }
        }
        return msg;
    }

    /**
     * parse a profile from string, add it to the list of profiles and store it in localStorage
     * @note you need to call loadProfile() manually if you set `sw` to `true`
     * @param raw
     * @param fallbackName the fallback name if the raw does not contain the name of the profile
     * @param sw whether to switch to the newly added schedule
     * by setting `current` to the name of the newly added profile
     */
    async addProfile(raw: string, fallbackName: string) {
        const rawData: SemesterStorage = JSON.parse(raw);

        // change modified time to new to it can overwrite remote profiles
        rawData.modified = new Date().toJSON();
        let profileName = rawData.name || fallbackName;
        let prof = this.profiles.find(p => p.name === profileName);
        if (prof) {
            if (
                !confirm(
                    `A profile named ${profileName} already exists! Click confirm to overwrite, click cancel to keep both.`
                )
            ) {
                let idx = 2;
                while (this.profiles.find(p => p.name === `${profileName} (${idx})`)) idx++;
                profileName = `${profileName} (${idx})`;

                rawData.name = profileName;
                localStorage.setItem(profileName, JSON.stringify(rawData));

                this.profiles.push((prof = this.createProfile(profileName)));
            }
        } else {
            this.profiles.push((prof = this.createProfile(profileName)));
        }
        // backward compatibility only
        if (!rawData.name) rawData.name = profileName;

        const data = JSON.stringify(rawData);
        localStorage.setItem(profileName, data);
        this.current = profileName;

        if (this.canSync && prof.remote) {
            const msg = await this.uploadProfile([
                {
                    profile: data,
                    name: profileName
                }
            ]);
            if (msg) return msg;
        }
    }

    isLatest(idx: number) {
        return this.profiles[idx].currentVersion === this.profiles[idx].versions[0].version;
    }

    _cre() {
        return [localStorage.getItem('username')!, localStorage.getItem('credential')!];
    }

    async getRemoteProfile(name: string, version: number) {
        const [username, credential] = this._cre();
        const request: BackendListRequest = {
            username,
            credential,
            name,
            version
        };
        const { data: resp } = await axios.post<BackendListResponse>(backend.down, request);
        const msg: NotiMsg<BackendListResponse['profiles'][0]> = {
            level: 'success',
            msg: ''
        };
        if (resp.success) {
            msg.payload = resp.profiles[0];
        } else {
            msg.level = 'error';
            msg.msg = `Failed to communicate with ${backend.name}: ${resp.message}. Please try to re-login from ${backend.name}.`;
            this.logout();
        }
        return msg;
    }

    async uploadProfile(profiles: BackendProfile[]) {
        const [username, credential] = this._cre();
        const request: BackendUploadRequest = {
            username,
            credential,
            profiles
        };
        const { data: resp } = await axios.post<BackendUploadResponse>(backend.up, request);
        if (!resp.success) {
            this.logout();
            return {
                msg: `Failed to communicate with ${backend.name}: ${resp.message}. Please try to re-login from ${backend.name}.`,
                level: 'error'
            } as const;
        }

        // for each uploaded profile, update their version history.
        for (let i = 0; i < profiles.length; i++) {
            const name = profiles[i].name;
            const version = resp.versions[i].sort((a, b) => b.version - a.version);
            const profile = this.profiles.find(p => p.name === name)!;
            profile.versions = version;
            profile.currentVersion = version[0].version;
        }
    }

    async syncProfiles(): Promise<NotiMsg<undefined>> {
        if (!this.canSync) {
            return {
                msg: 'No backend exists. Abort syncing profiles',
                level: 'warn'
            };
        }
        const [username, credential] = this._cre();
        const { data: resp } = await axios.post<BackendListResponse>(backend.down, {
            username,
            credential
        });
        if (!resp.success) {
            this.logout();
            return {
                msg: `Failed to communicate with ${backend.name}: ${resp.message}. Please try to re-login from ${backend.name}.`,
                level: 'error'
            };
        }

        const remoteProfMap = new Map(
            resp.profiles.map(p => {
                const parsed: SemesterStorage = JSON.parse(p.profile)!;
                return [
                    parsed.name,
                    {
                        versions: p.versions.sort((a, b) => b.version - a.version),
                        profile: parsed
                    }
                ];
            })
        );

        // for local profiles marked as sync, if they are not in the remote list, that means they are deleted (by another device). Remove them from local.
        this.profiles.concat().forEach(p => {
            if (p.remote && !remoteProfMap.has(p.name)) {
                this.deleteProfile(
                    p.name,
                    this.profiles.findIndex(p2 => p2.name === p.name),
                    false
                );
            }
        });

        const needUpload: string[] = [],
            needDownload: string[] = [];
        for (const [name, { profile: remoteProf, versions: remoteVersions }] of remoteProfMap) {
            const prof = this.profiles.find(p => p.name === name);
            if (prof && prof.remote) {
                const localProf: SemesterStorage = JSON.parse(localStorage.getItem(name)!);
                const localTime = new Date(localProf.modified).getTime();
                const remoteTime = new Date(remoteProf.modified).getTime();

                if (localTime < remoteTime) {
                    // remote profile is newer
                    localStorage.setItem(name, JSON.stringify(remoteProf));
                    prof.versions = remoteVersions;
                    prof.currentVersion = remoteVersions[0].version;

                    needDownload.push(name);
                } else if (localTime > remoteTime) {
                    // local profile is newer
                    needUpload.push(name);
                } else {
                    // if the local profile is the same as the remote profile (in terms of modified time), just fetch the version history from the remote.
                    prof.versions = remoteVersions;
                    prof.currentVersion = remoteVersions[0].version;
                }
            } else if (prof && !prof.remote) {
                // unsynchronized local profile that has the same name as the remote profile
                const localProf: SemesterStorage = JSON.parse(localStorage.getItem(name)!);
                if (
                    localProf.schedule.proposedSchedules.length > 1 ||
                    (localProf.schedule.proposedSchedules.length === 1 &&
                        (Object.keys(localProf.schedule.proposedSchedules[0].All).length > 0 ||
                            localProf.schedule.proposedSchedules[0].events.length > 0))
                ) {
                    // if the local is nonempty
                    // this case should rarely occur
                    const localTime = new Date(localProf.modified).getTime();
                    const remoteTime = new Date(remoteProf.modified).getTime();
                    if (localTime <= remoteTime) {
                        // remote is newer: overwrite local with remote and set remote to true
                        localStorage.setItem(name, JSON.stringify(remoteProf));
                        prof.remote = true;
                        prof.versions = remoteVersions;
                        prof.currentVersion = remoteVersions[0].version;

                        needDownload.push(name);
                    } else {
                        if (
                            confirm(
                                `On the cloud there exists a profile called ${name}, but locally you have a non-synchronized profile of the same name and is newer. Do you want to turn on synchronization for this profile?`
                            )
                        ) {
                            prof.remote = true;
                            needUpload.push(name);
                        }
                    }
                } else {
                    // if local is empty, we overwrite the local with the remote
                    localStorage.setItem(name, JSON.stringify(remoteProf));
                    prof.versions = remoteVersions;
                    prof.currentVersion = remoteVersions[0].version;
                    prof.remote = true;

                    needDownload.push(name);
                }
            } else {
                // this remote profile is not present locally. Download it.
                localStorage.setItem(name, JSON.stringify(remoteProf));
                this.profiles.push({
                    name,
                    remote: true,
                    versions: remoteVersions,
                    currentVersion: remoteVersions[0].version
                });

                needDownload.push(name);
            }
        }

        const msg = await this.uploadProfile(
            needUpload.map(p => ({
                name: p,
                profile: localStorage.getItem(p)!
            }))
        );
        if (msg) return msg;

        return {
            msg: `Successfully synchronized your profiles with Hoosmyprofessor. Uploaded ${needUpload.join(
                ', '
            ) || 'none'}, downloaded ${needDownload.join(', ') || 'none'}.`,
            level: 'success'
        };
    }

    logout() {
        localStorage.removeItem('username');
        localStorage.removeItem('credential');
        this.canSync = false;
    }
}

export default new Profile();
