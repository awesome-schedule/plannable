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
            try {
                this.profile.addProfile(
                    lz.decompressFromEncodedURIComponent(config.trim()),
                    'url loaded'
                );
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
