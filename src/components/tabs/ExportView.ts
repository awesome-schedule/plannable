/**
 * @module components/tabs
 */
import Store, { SemesterStorage } from '@/store';
import { savePlain, toICal } from '@/utils';
import lz from 'lz-string';
import { Component } from 'vue-property-decorator';
import { parse } from 'path';

/**
 * component for import/export/print schedules
 * @author Kaiying Shan, Hanzhi Zhou
 */
@Component
export default class ExportView extends Store {
    exportJson: string = 'schedule';
    exportICal: string = 'schedule';

    curProfileName =
        localStorage.getItem('curProfileId') ||
        (this.semester.currentSemester && this.semester.currentSemester.id) ||
        '';

    count = 0;
    profiles: string[] = JSON.parse(localStorage.getItem('profiles') || '[]');
    edit: boolean[] = [];
    newName: string[] = [];

    get compareId() {
        const id = localStorage.getItem('curProfileId')
            ? localStorage.getItem('curProfileId')
            : this.curProfileName;
        return id;
    }

    profileName(id: string) {
        const pf = localStorage.getItem(id);
        if (!pf) return '';
        const name = JSON.parse(pf).name;
        return name || id;
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

                if (
                    this.semester.currentSemester &&
                    this.profiles.indexOf(this.semester.currentSemester.id) === -1
                ) {
                    this.profiles.push(this.semester.currentSemester.id);
                    this.edit.push(false);
                    this.newName.push('');
                    // this.edit[this.semester.currentSemester.id] = false;
                }

                const profileName = raw_data.name || files[0].name;
                this.profiles.push(profileName);
                this.edit.push(false);
                this.newName.push('');

                this.curProfileName = profileName;
                localStorage.setItem('curProfileId', profileName);

                if (!raw_data.name) {
                    raw_data.name = profileName;
                    result = JSON.stringify(raw_data);
                }

                localStorage.setItem(profileName, result);

                this.selectSemester(raw_data.currentSemester, false, profileName);
                localStorage.setItem('profiles', JSON.stringify(this.profiles));
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
            this.curProfileName ? this.curProfileName : this.semester.currentSemester.id
        );
        if (json) savePlain(json, (this.exportJson || 'schedule') + '.json');
    }
    saveToIcal() {
        savePlain(toICal(this.schedule.currentSchedule), (this.exportICal || 'schedule') + '.ical');
    }
    exportToURL() {
        if (!this.semester.currentSemester) return;
        const json = localStorage.getItem(this.curProfileName || this.semester.currentSemester.id);
        if (json) window.location.search = 'config=' + lz.compressToEncodedURIComponent(json);
    }
    selectProfile(profileName: string) {
        const item = localStorage.getItem(profileName);
        if (!item) return;
        const raw = JSON.parse(item);
        this.selectSemester(raw.currentSemester, false, profileName);
        this.curProfileName = profileName;
        localStorage.setItem('curProfileId', profileName);
    }
    deleteProfile(id: string, idx: number) {
        if (this.curProfileName === id) {
            this.selectProfile(this.profiles[idx - 1]);
        }
        localStorage.removeItem(id);
        this.profiles.splice(idx, 1);
        this.edit.splice(idx, 1);
        this.newName.splice(idx, 1);
        // delete property
        localStorage.setItem('profiles', JSON.stringify(this.profiles));
    }
    enableEdit(idx: number) {
        this.edit[idx] = true;
    }
    finishEdit(id: string, idx: number) {
        const raw = localStorage.getItem(id);
        if (!raw) return;
        const parsed = JSON.parse(raw);
        parsed.name = this.newName[idx];
        localStorage.setItem(id, JSON.stringify(parsed));
        this.edit[idx] = false;
    }
    print() {
        window.print();
    }
}
