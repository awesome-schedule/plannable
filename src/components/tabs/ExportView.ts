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
    /**
     * get the meta data of a profile in an array
     * @param name
     */
    getMeta(name: string) {
        const data = localStorage.getItem(name);
        if (data) {
            let parsed: Partial<SemesterStorage> | null = null;
            try {
                parsed = JSON.parse(data);
            } catch (err) {
                console.log(err);
            }
            if (parsed) {
                const meta = [];
                if (parsed.modified) meta.push(new Date(parsed.modified).toLocaleString());
                if (parsed.currentSemester) meta.push(parsed.currentSemester.name);
                return meta;
            }
        }
        return ['Data corruption'];
    }

    onUploadJson(event: { target: EventTarget | null }) {
        const { files } = event.target as HTMLInputElement;
        if (!files) return;

        const reader = new FileReader();
        reader.onload = () => {
            if (reader.result) {
                const { profiles } = this.profile;
                const prevLen = profiles.length;
                try {
                    this.profile.addProfile(reader.result.toString(), files[0].name);
                    // unequal length: new profile name added
                    if (prevLen !== profiles.length) this.newName.push(null);
                } catch (err) {
                    console.error(err);
                    this.noti.error(err.message + ': Parsing error');
                }
                this.loadProfile();
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
        if (json) {
            const url = new URL(window.location.href);
            url.searchParams.set('config', lz.compressToEncodedURIComponent(json));
            this.modal.showURLModal(url.href);
        }
    }
    deleteProfile(name: string, idx: number) {
        if (confirm(`Are you sure to delete ${name}?`)) {
            this.newName.splice(idx, 1);
            const prof = this.profile.deleteProfile(name, idx);
            if (prof) this.loadProfile();
        }
    }
    selectProfile(profileName: string) {
        const item = localStorage.getItem(profileName);
        if (!item) return;
        this.profile.current = profileName;
        this.loadProfile();
    }
    finishEdit(oldName: string, idx: number) {
        const raw = localStorage.getItem(oldName);
        if (!raw) return;

        const newName = this.newName[idx];
        if (!newName) return this.$set(this.newName, idx, null);
        if (newName !== oldName) {
            const prevIdx = this.profile.profiles.findIndex(n => n === newName);
            if (prevIdx !== -1) return this.noti.error('Duplicated name!');
            this.profile.renameProfile(idx, oldName, newName, raw);
        }
        this.$set(this.newName, idx, null);
    }
    print() {
        window.print();
    }
}
