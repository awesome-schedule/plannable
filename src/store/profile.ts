import { SemesterJSON } from '@/models/Catalog';
import { SemesterStorage } from '.';
import { NotiMsg } from './notification';

class Profile {
    /**
     * a reactive property. whenever changed, load the profile with name being `current`
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
                    } catch (e) { }
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
     * @returns the name of the previous profile if the deleted profile is selected
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

    addProfile(raw: string, fallbackName: string): NotiMsg<string> {
        let raw_data: SemesterStorage;
        try {
            raw_data = JSON.parse(raw);
        } catch (error) {
            console.error(error);
            return {
                msg: error.message + ': Format Error',
                level: 'error'
            };
        }

        const profileName = raw_data.name || fallbackName;
        const prevIdx = this.profiles.findIndex(p => p === profileName);
        if (prevIdx !== -1) {
            if (!confirm(`A profile named ${profileName} already exists! Override it?`))
                return {
                    msg: 'cancelled',
                    level: 'info'
                };
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
        const msg: NotiMsg<string> = {
            msg: 'success',
            level: 'success'
        };
        // override: need to reload current profile
        if (prevIdx !== -1) return msg;
        msg.payload = this.current;
        return msg;
    }
}

const profile = new Profile();
export default profile;
