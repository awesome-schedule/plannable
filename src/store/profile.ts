import { SemesterJSON } from '@/models/Catalog';
import { SemesterStorage } from '.';

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
        if (name === this.current) {
            if (idx === this.profiles.length) {
                return (this.current = this.profiles[idx - 1]);
            } else {
                return (this.current = this.profiles[idx]);
            }
        }
        localStorage.removeItem(name);
    }

    /**
     * parse a profile from string, add it to the list of profiles and store it in localStorage
     * @note you need to call loadProfile() manually
     * @param raw
     * @param fallbackName the fallback name if the raw does not contain the name of the profile
     */
    addProfile(raw: string, fallbackName: string) {
        const raw_data: SemesterStorage = JSON.parse(raw);
        let profileName = raw_data.name || fallbackName;
        const prevIdx = this.profiles.findIndex(p => p === profileName);
        if (prevIdx !== -1) {
            if (
                !confirm(
                    // tslint:disable-next-line: max-line-length
                    `A profile named ${profileName} already exists! Click confirm to overwrite, click cancel to keep both`
                )
            ) {
                let idx = 2;
                while (this.profiles.includes(`${profileName} (${idx})`)) idx++;
                profileName = `${profileName} (${idx})`;

                raw_data.name = profileName;
                localStorage.setItem(profileName, JSON.stringify(raw_data));
                this.profiles.push(profileName);
            }
        } else {
            this.profiles.push(profileName);
        }

        if (!raw_data.name) {
            // backward compatibility
            raw_data.name = profileName;
            localStorage.setItem(profileName, JSON.stringify(raw_data));
        } else {
            localStorage.setItem(profileName, raw);
        }
        this.current = profileName;
    }
}

const profile = new Profile();
export default profile;
