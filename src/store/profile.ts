/**
 * @module store
 */

/**
 *
 */
import { SemesterJSON } from '@/models/Catalog';
import { SemesterStorage } from '.';
import axios from 'axios';
import { backend } from '@/config';

interface BackendRequestBase {
    username: string;
    credential: string;
}

interface BackendResponseBase {
    /** true if success, false otherwise */
    success: boolean;
    /** reason for failure. If success, can put anything here */
    message: string;
}

interface BackendListRequest extends BackendRequestBase {
    name: '...'; // the profile name. If omitted, return all the profiles (each profile should be the latest version)
    version: 1; // only present if "name" is present. If this field is missing, then the latest profile should be returned
}

interface BackendListResponse extends BackendResponseBase {
    /** if the name field of the request is missing, this should be a list of all profiles. Otherwise, this should be a list of 1 profile corresponding to the name and version given. */
    profiles: {
        /** keys of all historical versions for this profile. They can be used as the "version" field to query historical profiles */
        versions: number[];
        /** the body of the profile corresponding to the queried version. It should be the latest profile if the version number is missing */
        profile: string;
    }[];
}

interface BackendUploadRequest extends BackendRequestBase {
    /** list of profiles to be uploaded */
    profiles: {
        /** name of the profile */
        name: string;
        /** content of the profile */
        profile: string;
    }[];
}

interface BackendUploadResponse extends BackendResponseBase {
    versions: number[];
}

interface BackendEditRequest<T extends 'rename' | 'delete'> extends BackendRequestBase {
    action: T;
}

interface BackendRenameRequest extends BackendEditRequest<'rename'> {
    oldName: string;
    newName: string;
    profile: string;
}

interface BackendDeleteRequest extends BackendEditRequest<'delete'> {
    /** the name of the profile to be deleted */
    name: string;
}

interface BackendEditResponse extends BackendResponseBase {}

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

    constructor() {
        this.current = localStorage.getItem('currentProfile') || '';
        this.profiles = JSON.parse(localStorage.getItem('profiles') || '[]');
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
        this.profiles.splice(idx, 1, newName);

        if (this.canSync()) {
            const [username, credential] = this._cre();
            const request: BackendRenameRequest = {
                username,
                credential,
                action: 'rename',
                oldName,
                newName,
                profile: newProf
            };
            await axios.post<BackendEditResponse>(backend.edit, request);
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
        this.profiles.splice(idx, 1);
        localStorage.removeItem(name);

        if (this.canSync()) {
            const [username, credential] = this._cre();
            const request: BackendDeleteRequest = {
                username,
                credential,
                action: 'delete',
                name
            };
            await axios.post<BackendEditResponse>(backend.edit, request);
        }

        if (name === this.current) {
            if (idx === this.profiles.length) {
                return (this.current = this.profiles[idx - 1]);
            } else {
                return (this.current = this.profiles[idx]);
            }
        }
    }

    /**
     * parse a profile from string, add it to the list of profiles and store it in localStorage
     * @note you need to call loadProfile() manually if you set `sw` to `true`
     * @param raw
     * @param fallbackName the fallback name if the raw does not contain the name of the profile
     * @param sw whether to switch to the newly added schedule
     * by setting `current` to the name of the newly added profile
     */
    addProfile(raw: string, fallbackName: string, sw = true) {
        const rawData: SemesterStorage = JSON.parse(raw);
        let profileName = rawData.name || fallbackName;
        const prevIdx = this.profiles.findIndex(p => p === profileName);
        if (prevIdx !== -1) {
            if (
                !confirm(
                    `A profile named ${profileName} already exists! Click confirm to overwrite, click cancel to keep both`
                )
            ) {
                let idx = 2;
                while (this.profiles.includes(`${profileName} (${idx})`)) idx++;
                profileName = `${profileName} (${idx})`;

                rawData.name = profileName;
                localStorage.setItem(profileName, JSON.stringify(rawData));
                this.profiles.push(profileName);
            }
        } else {
            this.profiles.push(profileName);
        }

        if (!rawData.name) {
            // backward compatibility
            rawData.name = profileName;
            localStorage.setItem(profileName, JSON.stringify(rawData));
        } else {
            localStorage.setItem(profileName, raw);
        }
        if (sw) this.current = profileName;
    }

    _cre() {
        return [localStorage.getItem('username')!, localStorage.getItem('credential')!];
    }

    /**
     * return whether the credentials in the localStorage exist
     */
    canSync() {
        const [username, credential] = this._cre();
        return username && credential;
    }

    async fetchRemoteProfiles() {
        const [username, credential] = this._cre();
        return (
            await axios.post<string[]>(backend.down, {
                username,
                credential
            })
        ).data.map(s => JSON.parse(s) as SemesterStorage);
    }

    async uploadProfile(name: string, profile: string) {
        const [username, credential] = this._cre();
        await axios.post(backend.up, {
            username,
            credential,
            name,
            profile
        });
    }

    async syncProfiles() {
        if (!this.canSync()) {
            console.log('No backend exists. Abort syncing profiles');
            return;
        }

        const remoteProfiles = new Map(
            (await this.fetchRemoteProfiles()).map(prof => [prof.name, prof])
        );
        const localNames = new Set(this.profiles);

        const needUpload: string[] = [],
            needDownload: string[] = [];
        for (const name of remoteProfiles.keys()) {
            if (localNames.has(name)) {
                const localProf: SemesterStorage = JSON.parse(localStorage.getItem(name)!);
                const remoteProf: SemesterStorage = remoteProfiles.get(name)!;

                const localTime = new Date(localProf.modified).getTime();
                const remoteTime = new Date(remoteProf.modified).getTime();

                if (localTime < remoteTime) {
                    localStorage.setItem(name, JSON.stringify(remoteProfiles.get(name)!));
                    needDownload.push(name);
                } else if (localTime > remoteTime) {
                    needUpload.push(name);
                }
            } else {
                localStorage.setItem(name, JSON.stringify(remoteProfiles.get(name)!));
                this.profiles.push(name);
                needDownload.push(name);
            }
        }
        for (const name of localNames) {
            if (!remoteProfiles.has(name)) needUpload.push(name);
        }

        await Promise.all(
            needUpload.map(name => this.uploadProfile(name, localStorage.getItem(name)!))
        );
        console.log('uploaded', needUpload);
        console.log('downloaded', needDownload);
    }
}

export default new Profile();
