/**
 * the "view" of this project; the root Vue component that contains almost all of the child components and DOM
 * elements of the main webpage.
 * @module src/App
 * @author Hanzhi Zhou, Kaiying Shan, Elena Long, Zichao Hu
 */

/**
 *
 */
import { Component } from 'vue-property-decorator';
import MainContent from './components/MainContent.vue';

// tab components
import ClassView from './components/tabs/ClassView.vue';
import CompareView from './components/tabs/CompareView.vue';
import DisplayView from './components/tabs/DisplayView.vue';
import EventView from './components/tabs/EventView.vue';
import ExportView from './components/tabs/ExportView.vue';
import External from './components/tabs/External.vue';
import FilterView from './components/tabs/FilterView.vue';
import PaletteView from './components/tabs/PaletteView.vue';
import FuzzyView from './components/tabs/FuzzyView.vue';
import LogView from './components/tabs/LogView.vue';

// other components
import DateSeparator from './components/DateSeparator.vue';
import GridSchedule from './components/GridSchedule.vue';
import Pagination from './components/Pagination.vue';

// modals
import CourseModal from './components/modals/CourseModal.vue';
import SectionModal from './components/modals/SectionModal.vue';
import URLModal from './components/modals/URLModal.vue';
import VersionModal from './components/modals/VersionModal.vue';

import randomColor from 'randomcolor';
import { loadBuildingSearcher, loadTimeMatrix } from './data/BuildingLoader';
import Store, { parseFromURL } from './store';
import GeneratedSchedule from './models/GeneratedSchedule';
import { backend, runningOnElectron, version } from './config';
import axios from 'axios';

/** whether the version stored in localStorage matches the current version */
const match = localStorage.getItem('version') === version;
// then, override localStorage with the current version
localStorage.setItem('version', version);

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
        External,
        FuzzyView,
        LogView,
        // use dynamic component for this one because it is relatively large in size
        Information: () => import('./components/tabs/Information.vue'),

        Pagination,
        GridSchedule,
        DateSeparator,

        SectionModal,
        CourseModal,
        URLModal,
        VersionModal
    }
})
export default class App extends Store {
    get sideBar() {
        return this.status.sideBar;
    }

    get version() {
        return version;
    }

    get showInformation() {
        return !runningOnElectron;
    }

    async loadConfigFromURL(search: URLSearchParams) {
        const encoded = search.get('config');

        if (encoded) {
            try {
                this.profile.addProfile(JSON.stringify(await parseFromURL(encoded)), 'url loaded');
                await this.loadProfile(undefined, !match);
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
        // for debugging purpose
        (window as any).axios = axios;
        (window as any).vue = this;

        window.NativeModule = await window.GetNative();

        this.status.loading = true;
        const search = new URLSearchParams(window.location.search);

        if (search.get('auth') === backend.name) {
            return this.profile.loginBackend();
        }
        if (search.get('error')) {
            // failed to get auth code
            this.noti.error(`Failed to login: ${search.get('error_description')}`);
        }
        if (!match) this.modal.showReleaseNoteModal();

        // clear url after obtained url params
        history.replaceState(history.state, 'current', '/');

        console.time('load network');
        // note: these can be executed in parallel, i.e. they are not inter-dependent
        // eslint-disable-next-line prefer-const
        let [pay1, pay2, pay3, pay4, authResult] = await Promise.all([
            loadTimeMatrix(),
            loadBuildingSearcher(),
            this.semester.loadSemesters(),
            this.profile.syncProfiles(),
            this.profile.getBackendToken(search.get('code'))
        ]);

        // check if auth is successful. If success, sync profiles immediately.
        if (authResult) {
            this.profile.loadToken();
            pay4 = await this.profile.syncProfiles();
        }
        console.timeEnd('load network');
        if (pay4.level !== 'warn') this.noti.notify(pay4);

        this.noti.notify(pay1);
        if (pay1.payload) {
            window.timeMatrix = pay1.payload;
            const M = window.NativeModule;
            const ptr = M._malloc(window.timeMatrix.byteLength);
            M.HEAP32.set(window.timeMatrix, ptr / 4);
            M._setTimeMatrix(ptr, window.timeMatrix.length ** 0.5);
        }

        this.noti.notify(pay2);
        if (pay2.payload) window.buildingSearcher = pay2.payload;

        this.noti.notify(pay3);
        if (pay3.payload) {
            this.semester.semesters = pay3.payload;

            const urlResult = await this.loadConfigFromURL(search);
            if (!urlResult) {
                this.profile.initProfiles(this.semester.semesters);
                // if version mismatch, force-update semester data
                await this.loadProfile(this.profile.current, !match);
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

    /**
     * @note compare button will be shown iff in generated mode, so currentSchedule must be a GeneratedSchedule
     */
    addToCompare() {
        const idx = this.indexOfCompare();
        if (idx !== -1) {
            this.compare.splice(idx, 1);
        } else {
            const color = randomColor({ luminosity: 'dark' });
            this.compare.push({
                schedule: this.schedule.currentSchedule as GeneratedSchedule,
                profileName: this.profile.current,
                index: this.schedule.currentScheduleIndex,
                color,
                pIdx: this.schedule.cpIndex
            });
        }
    }
}
