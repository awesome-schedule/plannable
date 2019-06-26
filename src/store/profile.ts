import { SemesterJSON } from '@/models/Catalog';

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
                    localStorage.setItem(sem.name, oldData);
                    localStorage.removeItem(sem.id);
                    profiles.push(sem.name);
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
        localStorage.setItem(newName, JSON.stringify(parsed));
        localStorage.removeItem(oldName);
        this.profiles.splice(idx, 1, newName);
    }

    deleteProfile(name: string, idx: number) {
        this.profiles.splice(idx, 1);
        if (idx === this.profiles.length) {
            this.selectProfile(this.profiles[idx - 1 < 0 ? 0 : idx - 1]);
        } else {
            this.selectProfile(this.profiles[idx]);
        }
        localStorage.removeItem(name);
    }

    selectProfile(profileName: string) {
        const item = localStorage.getItem(profileName);
        if (!item) return;
        this.current = profileName;
    }
}

const profile = new Profile();
export default profile;
