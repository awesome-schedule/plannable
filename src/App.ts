/**
 * the "view" of this project; the root Vue component that contains almost all of the child components and DOM
 * elements of the main webpage.
 * @author Hanzhi Zhou, Kaiying Shan, Elena Long, Zichao Hu
 */

/**
 *
 */
import lz from 'lz-string';
import { Component } from 'vue-property-decorator';
import MainContent from './components/MainContent.vue';

// tab components
import ClassView from './components/tabs/ClassView.vue';
import DisplayView from './components/tabs/DisplayView.vue';
import EventView from './components/tabs/EventView.vue';
import ExportView from './components/tabs/ExportView.vue';
import External from './components/tabs/External.vue';
import FilterView from './components/tabs/FilterView.vue';
import PaletteView from './components/tabs/PaletteView.vue';
import CompareView from './components/tabs/CompareView.vue';

// other components
import GridSchedule from './components/GridSchedule.vue';
import Pagination from './components/Pagination.vue';
import CourseModal from './components/CourseModal.vue';
import SectionModal from './components/SectionModal.vue';
import URLModal from './components/URLModal.vue';
import DateSeparator from './components/DateSeparator.vue';

import { loadBuildingList, loadTimeMatrix } from './data/BuildingLoader';
import Store from './store';
import randomColor from 'randomcolor';

const version = '6.5';
/**
 * returns whether the version stored in localStorage matches the current version
 * then, override localStorage with the current version
 */
function checkVersion() {
    const match = localStorage.getItem('version') === version;
    localStorage.setItem('version', version);
    return match;
}

@Component({
    components: {
        MainContent,
        ClassView,
        EventView,
        DisplayView,
        FilterView,
        PaletteView,
        ExportView,
        CompareView,
        Pagination,
        GridSchedule,
        SectionModal,
        CourseModal,
        URLModal,
        External,
        DateSeparator,
        // use dynamic component for this one because it is relatively large in size
        Information: () => import('./components/tabs/Information.vue'),
        // opt-in components
        FuzzyView: () => import('./components/tabs/FuzzyView.vue'),
        LogView: () => import('./components/tabs/LogView.vue')
    }
})
export default class App extends Store {
    get sideBar() {
        return this.status.sideBar;
    }

    async loadConfigFromURL() {
        const config = new URLSearchParams(window.location.search).get('config');

        if (config) {
            const result = this.parseFromURL(config);
            try {
                this.profile.addProfile(result, 'url loaded');
                await this.loadProfile(undefined, !checkVersion());
                this.noti.success('Configuration loaded from URL!', 3, true);
                return true;
            } catch (err) {
                console.error(err);
                this.noti.error(err.message + ': Parsing error');
            }
        }
        return false;
    }

    /**
     * @author Zichao Hu
     * @see [[ExportView.convertJsonToArray]]
     * @param config
     */
    parseFromURL(config: string) {
        // get URL and convert to JSON
        const data: any[] = JSON.parse(lz.decompressFromEncodedURIComponent(config.trim()));

        // get the default objects to contruct the valid JSON
        const display = this.display.getDefault();
        const filter = this.filter.getDefault();

        // get the first four value
        const name = data[0];
        const modified = data[1];
        const currentSemester = { id: data[2], name: data[3] };

        // display
        // get and sort keys in display
        const display_keys = Object.keys(display).sort();

        // if the key name contains '_' then it corresponds to a certain index in data
        // else it is in the binary
        let counter = 4;
        let display_bit: number = data[10];
        for (const key of display_keys) {
            if (key.includes('_')) {
                display[key] = data[counter];
                counter += 1;
            } else {
                display[key] = display_bit % 2 === 1 ? true : false;
                display_bit = Math.floor(display_bit / 2);
            }
        }

        // filter
        // add timeSlots
        filter.timeSlots = data[11];

        // get allowClosed, allowWaitlist, mode from binary
        filter.allowClosed = Boolean(data[12] & 1);
        filter.allowWaitlist = Boolean(data[12] & 2);
        filter.sortOptions.mode = data[12] & 4;

        // sorting
        // get the binary of enable_reverse
        const enable_reverse = data[19];

        // copy the sortBy array
        const sortBy = filter.sortOptions.sortBy;

        // loop through the ascii initials and match to the object name
        let mask = 1;
        for (let i = 0; i < sortBy.length; i++) {
            const initial = data[13 + i];
            const sortOpt = sortBy.find(s => s.name.charCodeAt(0) === initial)!;

            // if matched, decode the enabled and reverse info from the binary
            sortOpt.enabled = Boolean(enable_reverse & mask);
            mask <<= 1;

            sortOpt.reverse = Boolean(enable_reverse & mask);
            mask <<= 1;
        }

        // add the schedule and palette
        const schedule = data[20];
        const palette = data[21];

        // construct a JSON
        const obj = {
            name,
            modified,
            currentSemester,
            display,
            filter,
            schedule,
            palette
        };
        console.log(obj);

        return JSON.stringify(obj);
    }

    async created() {
        this.status.loading = true;

        // note: these three can be executed in parallel, i.e. they are not inter-dependent
        const [pay1, pay2, pay3] = await Promise.all([
            loadTimeMatrix(),
            loadBuildingList(),
            this.semester.loadSemesters()
        ]);

        this.noti.notify(pay1);
        if (pay1.payload) window.timeMatrix = pay1.payload;

        this.noti.notify(pay2);
        if (pay2.payload) window.buildingList = pay2.payload;

        this.noti.notify(pay3);
        if (pay3.payload) {
            this.semester.semesters = pay3.payload;
            const urlResult = await this.loadConfigFromURL();
            if (!urlResult) {
                this.profile.initProfiles(this.semester.semesters);
                // if version mismatch, force-update semester data
                await this.loadProfile(this.profile.current, !checkVersion());
            } else {
                history.replaceState(history.state, 'current', '/');
            }
        }

        this.status.loading = false;
    }
    /**
     * @returns return the index of current schedule in compares array.
     *          return -1 if current schedule is not in compares.
     */
    indexOfCompare() {
        return this.compare.findIndex(c => c.schedule.equals(this.schedule.currentSchedule));
    }

    addToCompare() {
        const idx = this.indexOfCompare();
        if (idx !== -1) {
            this.compare.splice(idx, 1);
        } else {
            const color = randomColor({
                luminosity: 'dark'
            }) as string;
            this.compare.push({
                schedule: this.schedule.currentSchedule,
                profileName: this.profile.current,
                index: this.schedule.currentScheduleIndex,
                color,
                pIdx: this.schedule.cpIndex
            });
        }
    }
}
