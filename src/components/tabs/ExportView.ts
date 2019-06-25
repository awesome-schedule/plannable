/**
 * @module components/tabs
 */
import Store, { SemesterStorage } from '@/store';
import { savePlain, toICal } from '@/utils';
import lz from 'lz-string';
import { Component, Watch } from 'vue-property-decorator';

/**
 * component for import/export/print schedules
 * @author Kaiying Shan, Hanzhi Zhou
 */
@Component
export default class ExportView extends Store {
    exportJson: string = 'schedule';
    exportICal: string = 'schedule';

    currentProfile: string = '';
    count = 0;
    profiles: string[] = [];
    newName: (string | null)[] = [];

    created() {
        this.currentProfile = localStorage.getItem('currentProfile') || '';
        this.profiles = JSON.parse(localStorage.getItem('profiles') || '[]');
        this.newName = this.profiles.map(() => null);
    }

    onUploadJson(event: { target: EventTarget | null }) {
        const { files } = event.target as HTMLInputElement;
        if (!files) return;

        const reader = new FileReader();
        reader.onload = () => {
            if (reader.result) {
                let raw_data: SemesterStorage, result: string;
                try {
                    result = reader.result.toString();
                    raw_data = JSON.parse(result);
                } catch (error) {
                    console.error(error);
                    this.noti.error(error.message + ': File Format Error');
                    return;
                }

                const profileName = raw_data.name || files[0].name;

                // backward compatibility
                if (!raw_data.name) {
                    raw_data.name = profileName;
                    localStorage.setItem(profileName, JSON.stringify(raw_data));
                } else {
                    localStorage.setItem(profileName, result);
                }

                this.profiles.push(profileName);
                this.newName.push(null);
                this.currentProfile = profileName;
                this.loadProfile(profileName);
            } else {
                this.noti.warn('File is empty!');
            }
        };

        try {
            reader.readAsText(files[0]);
        } catch (error) {
            console.error(error);
            this.noti.error(error.message);
        }
    }
    saveToJson() {
        if (!this.semester.currentSemester) return;
        const json = localStorage.getItem(
            this.currentProfile ? this.currentProfile : this.semester.currentSemester.id
        );
        if (json) savePlain(json, (this.exportJson || 'schedule') + '.json');
    }
    saveToIcal() {
        savePlain(toICal(this.schedule.currentSchedule), (this.exportICal || 'schedule') + '.ical');
    }
    exportToURL() {
        if (!this.semester.currentSemester) return;
        const json = localStorage.getItem(this.currentProfile || this.semester.currentSemester.id);
        if (json) window.location.search = 'config=' + lz.compressToEncodedURIComponent(json);
    }
    selectProfile(profileName: string) {
        const item = localStorage.getItem(profileName);
        if (!item) return;
        this.currentProfile = profileName;
        this.loadProfile(profileName);
    }
    deleteProfile(name: string, idx: number) {
        this.profiles.splice(idx, 1);
        this.newName.splice(idx, 1);
        if (idx === this.profiles.length) {
            this.selectProfile(this.profiles[idx - 1]);
        } else {
            this.selectProfile(this.profiles[idx]);
        }
        localStorage.removeItem(name);
    }
    finishEdit(oldName: string, idx: number) {
        if (!this.newName[idx]) return;

        const raw = localStorage.getItem(oldName);
        if (!raw) return;

        const newName = this.newName[idx];
        if (!newName) return this.noti.error('Name cannot be empty!');

        const prevIdx = this.profiles.findIndex(n => n === newName);
        if (prevIdx !== -1 && prevIdx !== idx) return this.noti.error('Duplicated name!');

        if (oldName === this.currentProfile) this.currentProfile = newName;

        const parsed = JSON.parse(raw);
        parsed.name = newName;
        localStorage.setItem(newName, JSON.stringify(parsed));
        localStorage.removeItem(oldName);

        this.$set(this.profiles, idx, newName);
        this.$set(this.newName, idx, null);
    }
    print() {
        window.print();
    }

    @Watch('currentProfile')
    private curProfWatch() {
        localStorage.setItem('currentProfile', this.currentProfile);
    }

    @Watch('profiles', { deep: true })
    private profsWatch() {
        localStorage.setItem('profiles', JSON.stringify(this.profiles));
    }
}
