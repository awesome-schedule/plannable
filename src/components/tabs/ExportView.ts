/**
 * @module components/tabs
 */
import Store, { SemesterStorage } from '@/store';
import { savePlain, toICal } from '@/utils';
import lz from 'lz-string';
import { Component } from 'vue-property-decorator';

/**
 * component for import/export/print schedules
 * @author Kaiying Shan, Hanzhi Zhou
 */
@Component
export default class ExportView extends Store {
    exportJson: string = 'schedule';
    exportICal: string = 'schedule';
    newName: (string | null)[] = [];

    created() {
        this.newName = this.profile.profiles.map(() => null);
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

                // todo: name clashing
                this.profile.profiles.push(profileName);
                this.newName.push(null);
                this.profile.current = profileName;
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
        const json = localStorage.getItem(this.profile.current);
        if (json) savePlain(json, (this.exportJson || 'schedule') + '.json');
    }
    saveToIcal() {
        savePlain(toICal(this.schedule.currentSchedule), (this.exportICal || 'schedule') + '.ical');
    }
    exportToURL() {
        if (!this.semester.currentSemester) return;
        const json = localStorage.getItem(this.profile.current);
        if (json) window.location.search = 'config=' + lz.compressToEncodedURIComponent(json);
    }
    deleteProfile(name: string, idx: number) {
        this.newName.splice(idx, 1);
        this.profile.deleteProfile(name, idx);
    }
    finishEdit(oldName: string, idx: number) {
        const raw = localStorage.getItem(oldName);
        if (!raw) return;

        const newName = this.newName[idx];
        if (!newName) return this.noti.error('Name cannot be empty!');

        const prevIdx = this.profile.profiles.findIndex(n => n === newName);
        if (prevIdx !== -1 && prevIdx !== idx) return this.noti.error('Duplicated name!');

        this.profile.renameProfile(idx, oldName, newName, raw);
        this.$set(this.newName, idx, null);
    }
    print() {
        window.print();
    }
}
