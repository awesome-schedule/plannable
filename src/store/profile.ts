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
     * an array of profile names available in the localStorage
     */
    profiles: string[];
    /**
     *
     */
    versions: ProfileVersion[][];
    /**
     *
     */
    currentVersions: number[];
    canSync: boolean;

    constructor() {
        this.current = localStorage.getItem('currentProfile') || '';
        this.profiles = JSON.parse(localStorage.getItem('profiles') || '[]');
        this.versions = Array.from({ length: this.profiles.length }, () => []);
        this.currentVersions = Array.from({ length: this.profiles.length }, () => 1);
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
            this.profiles = profiles;
        }
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

        // use splice for reactivity purpose
        Vue.set(this.profiles, idx, newName);

        if (this.canSync) {
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

            Vue.set(
                this.versions,
                idx,
                resp.versions.sort((a, b) => b.version - a.version)
            );
            Vue.set(this.currentVersions, idx, resp.versions[0].version);
        }
    }

    /**
     * delete a profile
     * @param name
     * @param idx
     * @returns the name of the previous profile if the deleted profile is selected,
     * returns undefined otherwise
     */
    async deleteProfile(name: string, idx: number) {
        const msg: NotiMsg<string> = {
            msg: '',
            level: 'success'
        };
        if (this.canSync) {
            const [username, credential] = this._cre();
            const request: BackendDeleteRequest = {
                username,
                credential,
                action: 'delete',
                name
            };
            const { data: resp } = await axios.post<BackendDeleteResponse>(backend.edit, request);
            if (!resp.success) {
                this.logout();
                msg.level = 'error';
                msg.msg = `Failed to communicate with ${backend.name}: ${resp.message}. Please try to re-login from ${backend.name}.`;
            } else {
                this.versions.splice(idx, 1);
                this.currentVersions.splice(idx, 1);
            }
        }

        this.profiles.splice(idx, 1);
        localStorage.removeItem(name);

        if (name === this.current) {
            if (idx === this.profiles.length) {
                msg.payload = this.current = this.profiles[idx - 1];
            } else {
                msg.payload = this.current = this.profiles[idx];
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
        const prevIdx = this.profiles.findIndex(p => p === profileName);
        if (prevIdx !== -1) {
            if (
                !confirm(
                    `A profile named ${profileName} already exists! Click confirm to overwrite, click cancel to keep both.`
                )
            ) {
                let idx = 2;
                while (this.profiles.includes(`${profileName} (${idx})`)) idx++;
                profileName = `${profileName} (${idx})`;

                rawData.name = profileName;
                localStorage.setItem(profileName, JSON.stringify(rawData));

                this.profiles.push(profileName);
                this.versions.push([]);
                this.currentVersions.push(1);
            }
        } else {
            this.profiles.push(profileName);
            this.versions.push([]);
            this.currentVersions.push(1);
        }
        // backward compatibility only
        if (!rawData.name) rawData.name = profileName;

        const data = JSON.stringify(rawData);
        localStorage.setItem(profileName, data);
        this.current = profileName;
        const msg = await this.uploadProfile([
            {
                profile: data,
                name: profileName
            }
        ]);
        if (msg) return msg;
    }

    isLatest(idx: number) {
        return this.currentVersions[idx] === this.versions[idx][0].version;
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

        for (let i = 0; i < profiles.length; i++) {
            const name = profiles[i].name;
            const version = resp.versions[i].sort((a, b) => b.version - a.version);
            const idx = this.profiles.findIndex(p => p === name);
            Vue.set(this.versions, idx, version);
            Vue.set(this.currentVersions, idx, version[0].version);
        }
    }

    async syncProfiles(): Promise<NotiMsg<undefined> | undefined> {
        if (!this.canSync) {
            console.log('No backend exists. Abort syncing profiles');
            return;
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
        const localNames = this.profiles;

        const needUpload: string[] = [],
            needDownload: string[] = [];
        for (const [name, { profile: remoteProf, versions: remoteVersions }] of remoteProfMap) {
            const localIdx = localNames.findIndex(p => p === name);
            if (localIdx !== -1) {
                const localProf: SemesterStorage = JSON.parse(localStorage.getItem(name)!);
                const localTime = new Date(localProf.modified).getTime();
                const remoteTime = new Date(remoteProf.modified).getTime();

                if (localTime < remoteTime) {
                    localStorage.setItem(name, JSON.stringify(remoteProf));
                    Vue.set(this.versions, localIdx, remoteVersions);
                    Vue.set(this.currentVersions, localIdx, remoteVersions[0].version);

                    needDownload.push(name);
                } else if (localTime > remoteTime) {
                    needUpload.push(name);
                } else {
                    Vue.set(this.versions, localIdx, remoteVersions);
                    Vue.set(this.currentVersions, localIdx, remoteVersions[0].version);
                }
            } else {
                localStorage.setItem(name, JSON.stringify(remoteProf));
                this.profiles.push(name);
                this.versions.push(remoteVersions);
                this.currentVersions.push(remoteVersions[0].version);

                needDownload.push(name);
            }
        }
        for (const name of localNames) {
            if (!remoteProfMap.has(name)) needUpload.push(name);
        }

        const msg = await this.uploadProfile(
            needUpload.map(p => ({
                name: p,
                profile: localStorage.getItem(p)!
            }))
        );
        if (msg) return msg;

        console.log('uploaded', needUpload);
        console.log('downloaded', needDownload);
    }

    logout() {
        localStorage.removeItem('username');
        localStorage.removeItem('credential');
        this.canSync = false;
    }
}

export default new Profile();
