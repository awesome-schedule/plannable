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

    curId =
        localStorage.getItem('curProfileId') ||
        (this.semester.currentSemester && this.semester.currentSemester.id) ||
        '';

    // curId = '';
    count = 0;
    profiles: string[] = JSON.parse(localStorage.getItem('profiles') || '[]');
    edit: boolean[] = new Array(this.profiles.length);
    newName: string[] = new Array(this.profiles.length);

    get compareId() {
        const id = localStorage.getItem('curProfileId')
            ? localStorage.getItem('curProfileId')
            : this.curId;
        return id;
    }

    profileName(id: string) {
        const pf = localStorage.getItem(id);
        if (!pf) return '';
        const name = JSON.parse(pf).name;
        return name || id;
    }

    onUploadJson(event: { target: EventTarget | null }) {
        const input = event.target as HTMLInputElement;

        if (!input.files) return;

        const reader = new FileReader();
        reader.onload = () => {
            if (reader.result) {
                let raw_data: SemesterStorage, result;
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

                const id = input.files ? input.files[0].name : 'profile' + this.count++;
                this.profiles.push(id);
                this.edit.push(false);
                this.newName.push('');
                // this.edit[id] = false;
                this.curId = id;
                localStorage.setItem('curProfileId', id);

                if (!raw_data.name) {
                    raw_data.name = id;
                    result = JSON.stringify(raw_data);
                }

                localStorage.setItem(id, result);

                this.selectSemester(raw_data.currentSemester, false, id);
                localStorage.setItem('profiles', JSON.stringify(this.profiles));
            } else {
                this.noti.warn('File is empty!');
            }
        };

        try {
            reader.readAsText(input.files[0]);
        } catch (error) {
            console.error(error);
            this.noti.error(error.message);
        }
    }
    saveToJson() {
        if (!this.semester.currentSemester) return;
        const json = localStorage.getItem(
            this.curId ? this.curId : this.semester.currentSemester.id
        );
        if (json) savePlain(json, (this.exportJson || 'schedule') + '.json');
    }
    saveToIcal() {
        savePlain(toICal(this.schedule.currentSchedule), (this.exportICal || 'schedule') + '.ical');
    }
    exportToURL() {
        if (!this.semester.currentSemester) return;
        const json = localStorage.getItem(this.curId || this.semester.currentSemester.id);
        if (json) window.location.search = 'config=' + lz.compressToEncodedURIComponent(json);
    }
    selectProfile(id: string) {
        const item = localStorage.getItem(id);
        if (!item) return;
        const raw = JSON.parse(item);
        this.selectSemester(raw.currentSemester, false, id);
        this.curId = id;
        localStorage.setItem('curProfileId', id);
    }
    deleteProfile(id: string, idx: number) {
        if (this.curId === id) {
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
