/**
 * @module store
 */

/**
 *
 */
import { SemesterJSON } from '@/models/Catalog';
import { SemesterStorage } from '.';

/**
 * the profile class handles profiles adding, renaming and deleting
 * @note profile selection is handled in the [[Store]] class
 * because it also needs to manipulate other store modules
 * @author Hanzhi Zhou
 */
class Profile {
    /**
     * a reactive property. whenever changed, the `currentProfile` in the `localStorage` will be updated
     * @see [[Store.c]]
     */
    current: string;
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
    renameProfile(idx: number, oldName: string, newName: string, raw: string) {
        if (oldName === this.current) this.current = newName;

        const parsed = JSON.parse(raw);
        parsed.name = newName;
        localStorage.removeItem(oldName);
        localStorage.setItem(newName, JSON.stringify(parsed));

        // use splice for reactivity purpose
        this.profiles.splice(idx, 1, newName);
    }

    /**
     * delete a profile
     * @param name
     * @param idx
     * @returns the name of the previous profile if the deleted profile is selected,
     * returns undefined otherwise
     */
    deleteProfile(name: string, idx: number) {
        this.profiles.splice(idx, 1);
        localStorage.removeItem(name);
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
}

export default new Profile();
