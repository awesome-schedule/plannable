/**
 * the "view" of this project; the root Vue component that contains almost all of the child components and DOM
 * elements of the main webpage.
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
import { backend } from './config';
import { loadBuildingSearcher, loadTimeMatrix } from './data/BuildingLoader';
import Store, { parseFromURL } from './store';
import { getReleaseNote } from './utils';
import GeneratedSchedule from './models/GeneratedSchedule';

const version = require('../package.json').version;

/**
 * returns whether the version stored in localStorage matches the current version
 * then, override localStorage with the current version
 */
function checkVersion() {
    const match = localStorage.getItem('version') === version;
    localStorage.setItem('version', version);
    if (!match) {
        getReleaseNote().then(note => $('#release-note-body').html(note));
        $('#versionModal').modal();
    }
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
        External,
        // use dynamic component for this one because it is relatively large in size
        Information: () => import('./components/tabs/Information.vue'),
        // opt-in tabs
        FuzzyView: () => import('./components/tabs/FuzzyView.vue'),
        LogView: () => import('./components/tabs/LogView.vue'),

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

    async loadCoursesFromURL() {
        const courseArray = new URLSearchParams(window.location.search).get('courses');
        if (courseArray) {
            try {
                const courses = JSON.parse(decodeURIComponent(courseArray));
                if (courses && courses instanceof Array) {
                    const schedule = this.schedule.getDefault();
                    courses.forEach(key => schedule.currentSchedule.update(key, -1));
                    this.profile.addProfile(JSON.stringify({ schedule }), backend.name);
                    await this.loadProfile(undefined, !checkVersion());

                    this.noti.success('Courses loaded from ' + backend.name, 3, true);
                    return true;
                } else {
                    throw new Error('Invalid course format');
                }
            } catch (e) {
                this.noti.error(
                    `Failed to load courses from ${backend.name}: ` + e.message,
                    3,
                    true
                );
                return false;
            }
        }
        return false;
    }

    async loadConfigFromURL() {
        const encoded = new URLSearchParams(window.location.search).get('config');

        if (encoded) {
            try {
                this.profile.addProfile(JSON.stringify(await parseFromURL(encoded)), 'url loaded');
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
     * load credentials from backend
     */
    loadCredentials() {
        const search = new URLSearchParams(window.location.search);
        const username = search.get('username'),
            credential = search.get('credential');
        if (username && credential) {
            localStorage.setItem('username', username);
            localStorage.setItem('credential', credential);
            return true;
        }
    }

    async created() {
        this.status.loading = true;

        // note: these three can be executed in parallel, i.e. they are not inter-dependent
        const [pay1, pay2, pay3] = await Promise.all([
            loadTimeMatrix(),
            loadBuildingSearcher(),
            this.semester.loadSemesters()
        ]);

        this.noti.notify(pay1);
        if (pay1.payload) window.timeMatrix = pay1.payload;

        this.noti.notify(pay2);
        if (pay2.payload) window.buildingSearcher = pay2.payload;

        this.noti.notify(pay3);
        if (pay3.payload) {
            this.semester.semesters = pay3.payload;
            const cre = this.loadCredentials();
            const urlResult = (await this.loadConfigFromURL()) || (await this.loadCoursesFromURL());
            if (!urlResult) {
                this.profile.initProfiles(this.semester.semesters);
                // if version mismatch, force-update semester data
                await this.loadProfile(this.profile.current, !checkVersion());
            }
            // clear url after obtained credentials/courses/config
            if (urlResult || cre) history.replaceState(history.state, 'current', '/');
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
