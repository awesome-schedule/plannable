/* eslint-disable @typescript-eslint/camelcase */
/**
 * @module src/store
 */

/**
 *
 */
import { SemesterJSON } from '@/models/Catalog';
import { SemesterStorage } from '.';
import axios from 'axios';
import { backend, runningOnElectron } from '@/config';
import { NotiMsg } from './notification';
import { stringify } from 'querystring';
import { timeout } from '@/utils';

interface BackendBaseResponse {
    /** true if success, false otherwise */
    success: boolean;
    /** reason for failure. If success, can put anything here */
    message: string;
}

interface BackendFailedResponse extends BackendBaseResponse {
    success: false;
}

interface BackendListRequest {
    /** the profile name. If omitted, return all the profiles (each profile should be the latest version) */
    name?: string;
    /** only present if "name" is present. If this field is missing, then the latest profile should be returned */
    version?: number;
}

interface ProfileVersion {
    /** number of milliseconds since Unix epoch */
    modified: number;
    /** User Agent from the Http Header */
    userAgent: string;
    /** the version number */
    version: number;
}

interface BackendListItem {
    /** keys of all historical versions for this profile. They can be used as the "version" field to query historical profiles */
    versions: ProfileVersion[];
    /** the body of the profile corresponding to the queried version. It should be the latest profile if the version number is missing */
    profile: string;
}

interface BackendListResponse extends BackendBaseResponse {
    success: true;
    /** if the name field of the request is missing, this should be a list of all profiles. Otherwise, this should be a list of 1 profile corresponding to the name and version given. */
    profiles: BackendListItem[];
}

/** the format of a profile entry to upload to the remote */
interface BackendProfile {
    /** name of the profile */
    name: string;
    /** content of the profile */
    profile: string;
    /** whether to force create a new version for this file. If this field is false or is not present, then it is up to the server to decide whether to create a new version */
    new?: true;
}

interface BackendUploadRequest {
    /** list of profiles to be uploaded */
    profiles: BackendProfile[];
}

interface BackendUploadResponse extends BackendBaseResponse {
    success: true;
    /** version information of each newly uploaded profile. If failed, this field is not present */
    versions: ProfileVersion[][];
}

interface BackendRenameRequest {
    action: 'rename';
    oldName: string;
    newName: string;
    profile: string;
}

interface BackendRenameResponse extends BackendBaseResponse {
    success: true;
    versions: ProfileVersion[];
}

interface BackendDeleteRequest {
    action: 'delete';
    /** the name of the profile to be deleted */
    name: string;
}

interface BackendDeleteResponse extends BackendBaseResponse {
    success: true;
}

export interface LocalProfileEntry {
    /** name of the profile */
    name: string;
    /** whether the profile is synced with the remote */
    remote: boolean;
    /** historical versions of this profile stored on the remote. Invalid if remote=false */
    versions: ProfileVersion[];
    /** current version of this profile selected (locally). Invalid if remote=false */
    currentVersion: number;
}

/**
 * the profile class handles profiles adding, renaming and deleting
 * @note profile selection is handled in the [[Store]] class
 * because it also needs to manipulate other store modules
 * @author Hanzhi Zhou
 */
class Profile {
    /**
     * the name of the current profile.
     * This is a reactive property. Whenever changed, the `currentProfile` in the `localStorage` will be updated
     */
    current: string;
    /**
     * an array of local profile names and their associated information
     */
    profiles: LocalProfileEntry[];
    /**
     * the access token type. If this field is non-empty, that means we have a valid access token and can communicate with the backend.
     */
    tokenType!: string;
    private accessToken!: string;

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

        this.loadToken();
    }

    loadToken() {
        this.tokenType = localStorage.getItem('token_type') || '';
        this.accessToken = localStorage.getItem('access_token') || '';
    }

    /**
     * initialize profile storage if it does not exist already.
     * set [[Profile.current]] to the name of the latest semester
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

    createProfile(name: string): LocalProfileEntry {
        return {
            name,
            remote: false,
            versions: [],
            currentVersion: -1
        };
    }

    /**
     * from https://stackoverflow.com/questions/18338890/are-there-any-sha-256-javascript-implementations-that-are-generally-considered-t
     * @param message
     */
    async sha256(message: string) {
        // encode as UTF-8
        const msgBuffer = new TextEncoder().encode(message);

        // hash the message
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);

        // convert ArrayBuffer to Array
        const hashArray = Array.from(new Uint8Array(hashBuffer));

        // convert bytes to hex string
        const hashHex = hashArray.map(b => ('00' + b.toString(16)).slice(-2)).join('');
        return hashHex;
    }

    /**
     * get the redirect url for the authorization code flow. For the desktop app (electron), a configured uri will be used.
     */
    private getRedirectURL() {
        return runningOnElectron ? backend.oauth_electron_redirect_uri : window.location.origin;
    }

    /**
     * redirect to the url for requesting an authorization code. It should redirect back with the code attached to the url.
     */
    async loginBackend() {
        const code_verifier = Math.random().toString();
        const state = Math.random().toString();
        localStorage.setItem('auth_state', state);
        localStorage.setItem('auth_code_verifier', code_verifier);
        window.location.href = `${backend.code}?${stringify({
            client_id: backend.client_id,
            state,
            redirect_uri: this.getRedirectURL(),
            code_challenge: await this.sha256(code_verifier),
            code_challenge_method: 'S256'
        })}`;
    }

    /**
     * using the code, request an access token.
     * @param code
     */
    async getBackendToken(code: string | null) {
        if (code) {
            const response = await axios.post(backend.token, {
                client_id: backend.client_id,
                code,
                grant_type: 'authorization_code',
                code_verifier: localStorage.getItem('auth_code_verifier'),
                redirect_uri: this.getRedirectURL()
            });
            localStorage.removeItem('auth_state');
            localStorage.removeItem('auth_code_verifier');
            const data = response.data;
            if (data['access_token']) {
                localStorage.setItem('access_token', data['access_token']);
                localStorage.setItem('token_type', data['token_type']);
                return true;
            }
        }
        return false;
    }

    /**
     * rename a profile. If remote=true, also rename the remote profile.
     * note that name duplication is not checked! This check should be done by the caller.
     * @see [[ExportView.renameProfile]]
     * @param raw the content fetched from localStorage.getItem(oldName)
     */
    async renameProfile(idx: number, oldName: string, newName: string, raw: string) {
        if (oldName === this.current) this.current = newName;

        const parsed = JSON.parse(raw);
        parsed.name = newName;
        localStorage.removeItem(oldName);

        const newProf = JSON.stringify(parsed);
        localStorage.setItem(newName, newProf);

        this.profiles[idx].name = newName;

        if (this.tokenType && this.profiles[idx].remote) {
            const resp = await this.requestBackend<BackendRenameRequest, BackendRenameResponse>(
                backend.edit,
                {
                    action: 'rename',
                    oldName,
                    newName,
                    profile: newProf
                }
            );
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

    /**
     * delete a profile from the remote
     * @param name
     */
    async deleteRemote(name: string) {
        const msg: NotiMsg<string> = {
            msg: '',
            level: 'success'
        };
        const resp = await this.requestBackend<BackendDeleteRequest, BackendDeleteResponse>(
            backend.edit,
            {
                action: 'delete',
                name
            }
        );
        if (!resp.success) {
            if (resp.message === "Profile doesn't exist") {
                msg.level = 'warn';
                msg.msg = `Profile ${name} is already deleted from ${backend.name}! The deletion was probably requested by another device.`;
            } else {
                this.logout();
                msg.level = 'error';
                msg.msg = `Failed to communicate with ${backend.name}: ${resp.message}. Please try to re-login from ${backend.name}.`;
            }
        }
        return msg;
    }

    /**
     * delete a profile. If remote and requestRemote=true, also delete it from the remote.
     * @returns A noti message containing the name of the previous profile if the deleted profile is selected, undefined otherwise
     */
    async deleteProfile(name: string, idx: number, requestRemote = true) {
        let msg: NotiMsg<string> = {
            msg: '',
            level: 'success'
        };
        if (this.tokenType && this.profiles[idx].remote && requestRemote)
            msg = await this.deleteRemote(name);

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
     * parse a profile from string, add it to the list of profiles, store it in localStorage, and set [[Profile.current]] to be the newly added profile
     * @note it is the caller's responsibility to call loadProfile() to load the newly added profile
     * @param raw the raw string representation of the profile (before JSON.parse)
     * @param fallbackName the fallback name if the raw does not contain the name of the profile
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

        if (this.tokenType && prof.remote) {
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
        const prof = this.profiles[idx];
        return !prof.remote || prof.currentVersion === prof.versions[0].version;
    }

    /**
     * request a backend api endpoint with authorization headers
     * @param endpoint url for the api endpoint
     * @param request the request object
     */
    private async requestBackend<RequestType, ResponseType extends BackendBaseResponse>(
        endpoint: string,
        request: RequestType
    ): Promise<ResponseType | BackendFailedResponse> {
        try {
            return (
                await timeout(
                    axios.post<ResponseType>(endpoint, request, {
                        headers: {
                            Authorization: this.tokenType + ' ' + this.accessToken
                        }
                    }),
                    5000,
                    'Timed out'
                )
            ).data;
        } catch (err) {
            return {
                success: false,
                message: err.message || err
            };
        }
    }

    /**
     * get a specific version of a profile
     */
    async getRemoteProfile(name: string, version: number) {
        const resp = await this.requestBackend<BackendListRequest, BackendListResponse>(
            backend.down,
            {
                name,
                version
            }
        );
        const msg: NotiMsg<BackendListItem> = {
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

    /**
     * upload the list of profiles given to the remote, and also update their version histories
     * @note the list of profiles given must be present in [[Profile.profiles]]. If not, [[Profile.addProfile]] must be called first.
     * @param profiles
     * @returns an error message when failed, undefined when success
     */
    async uploadProfile(profiles: BackendProfile[]) {
        const resp = await this.requestBackend<BackendUploadRequest, BackendUploadResponse>(
            backend.up,
            { profiles }
        );

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

    /**
     * Synchronize local profiles with the remote profiles
     * @returns a noti message indicating success/failure
     */
    async syncProfiles(): Promise<NotiMsg<undefined>> {
        if (!this.tokenType) {
            return {
                msg: 'No backend exists. Abort syncing profiles',
                level: 'warn'
            };
        }
        const resp = await this.requestBackend<BackendListRequest, BackendListResponse>(
            backend.down,
            {}
        );
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

        const needUpload: BackendProfile[] = [],
            needDownload: string[] = [];
        for (const [name, { profile: remoteProf, versions: remoteVersions }] of remoteProfMap) {
            const prof = this.profiles.find(p => p.name === name);
            if (prof && prof.remote) {
                const localRaw = localStorage.getItem(name)!;
                const localProf: SemesterStorage = JSON.parse(localRaw);
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
                    needUpload.push({
                        name,
                        profile: localRaw,
                        new: true
                    });
                } else {
                    // if the local profile is the same as the remote profile (in terms of modified time), just fetch the version history from the remote.
                    prof.versions = remoteVersions;
                    prof.currentVersion = remoteVersions[0].version;
                }
            } else if (prof && !prof.remote) {
                // unsynchronized local profile that has the same name as the remote profile
                const localRaw = localStorage.getItem(name)!;
                const localProf: SemesterStorage = JSON.parse(localRaw);
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
                                `On the cloud (${backend.name}) there exists a profile called "${name}", but locally you have a non-synchronized profile of the same name and is newer. Do you want to turn on synchronization for this profile? If you turned on synchronization, a new version of "${name}" will be created on ${backend.name}. You will still be able to retrieve the original version on ${backend.name} by viewing the version history.`
                            )
                        ) {
                            prof.remote = true;
                            needUpload.push({
                                name,
                                profile: localRaw,
                                new: true
                            });
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

        const msg = await this.uploadProfile(needUpload);
        if (msg) return msg;

        return {
            msg: `Successfully synchronized your profiles with Hoosmyprofessor. Uploaded ${needUpload
                .map(p => p.name)
                .join(', ') || 'none'}, downloaded ${needDownload.join(', ') || 'none'}.`,
            level: 'success'
        };
    }

    logout() {
        localStorage.removeItem('token_type');
        localStorage.removeItem('access_token');
        this.tokenType = '';
        this.accessToken = '';
    }
}

export default new Profile();
