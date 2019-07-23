/**
 * @module components/tabs
 */
import Store, { SemesterStorage } from '@/store';
import { savePlain, toICal } from '@/utils';
import lz from 'lz-string';
import { Component, Watch } from 'vue-property-decorator';

/**
 * component for import/export/print schedules and managing profiles
 * @author Kaiying Shan, Hanzhi Zhou, Zichao Hu
 */
@Component
export default class ExportView extends Store {
    fileName = 'schedule';
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
                console.error(err);
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
        const input = event.target as HTMLInputElement;
        const { files } = input;
        if (!files) return;

        const reader = new FileReader();
        reader.onload = async () => {
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
                await this.loadProfile();
            } else {
                this.noti.warn('File is empty!');
            }
            input.value = '';
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
        if (json) savePlain(json, (this.fileName || 'schedule') + '.json');
    }
    saveToIcal() {
        savePlain(toICal(this.schedule.currentSchedule), (this.fileName || 'schedule') + '.ical');
    }
    exportToURL() {
        if (!this.semester.currentSemester) return;
        const json = localStorage.getItem(this.profile.current);
        if (json) {
            const result = this.convertJsonToArray(json);
            const url = new URL(window.location.href);
            url.searchParams.set('config', lz.compressToEncodedURIComponent(result));
            this.modal.showURLModal(url.href);
        }
    }

    /**
     * See [[App.parseFromURL]]
     * convert JSON string to tuple of tuples to reduce the num of chars
     * @author Zichao Hu
     * @param jsonString
     */
    convertJsonToArray(jsonString: string) {
        /*
        result =>
        name
        modified
        currentSemester.id
        currentSemester.name,
        _earliest
        _fullHeight
        _lastest
        _maxNumSchedules
        _numsearchResults
        _partialHeight
        binary: combineSections, enableFuzzy, enableLog, expandOnEntering, multiSelect,
        showClasslistTitle, showInstructor, showRoom, showTime, standard
        timeSlots
        binary: allowClosed, Waitlist, mode
        sortOptions: name_initial ascii code :[c,d,l,n,v,I] --> could change in order
        binary: enabled/reverse
        schedule
        palette

        */

        // get values from the json object
        const json: SemesterStorage = JSON.parse(jsonString);
        const { name, modified, currentSemester, display, filter, schedule, palette } = json;

        // add first four value the the array
        const result = [];
        result.push(name, modified, currentSemester.id, currentSemester.name);

        // compressing display
        // get all keys in the display object and sort them
        const display_keys = Object.keys(display).sort();

        // convert to binary, the first key => the first/rightmost bit
        // there are 10 keys to consider
        let display_bit = 0;
        let counter = 0;
        for (const key of display_keys) {
            if (display[key] === true) {
                display_bit += 2 ** counter;
                counter++;
            } else if (display[key] === false) {
                counter++;
            } else {
                result.push(display[key]);
            }
        }

        result.push(display_bit);

        // compressing filter
        // add timeSlots to array
        result.push(filter.timeSlots);

        // convert allowClosed, allowWaitlist, mode to binary
        let filter_bit = 0;
        if (filter.allowClosed) {
            filter_bit += 2 ** 0;
        }
        if (filter.allowWaitlist) {
            filter_bit += 2 ** 1;
        }
        if (filter.sortOptions.mode === 1) {
            filter_bit += 2 ** 2;
        }
        result.push(filter_bit);

        // sorting
        // add all initial ascii to the array in order
        // add the binary of their repestive state: enabled or reverse
        counter = 0;
        filter_bit = 0;
        for (const sortBy of filter.sortOptions.sortBy) {
            const ascii = sortBy.name.charCodeAt(0);
            result.push(ascii);
            if (sortBy.enabled) {
                filter_bit += 2 ** counter;
            }
            counter += 1;
            if (sortBy.reverse) {
                filter_bit += 2 ** counter;
            }
            counter += 1;
        }
        result.push(filter_bit);

        // add schedule and palette objects to the array
        result.push(schedule);
        result.push(palette);
        return JSON.stringify(result);
    }
    deleteProfile(name: string, idx: number) {
        if (confirm(`Are you sure to delete ${name}?`)) {
            this.newName.splice(idx, 1);
            const prof = this.profile.deleteProfile(name, idx);
            if (prof) this.loadProfile();
        }
    }
    selectProfile(profileName: string) {
        if (profileName === this.profile.current) return;
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

    @Watch('profile.current', { immediate: true })
    private w() {
        this.fileName = this.profile.current;
    }
}
