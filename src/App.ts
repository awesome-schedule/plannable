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

// tab components
import ClassView from './components/tabs/ClassView.vue';
import DisplayView from './components/tabs/DisplayView.vue';
import EventView from './components/tabs/EventView.vue';
import FuzzyView from './components/tabs/FuzzyView.vue';
import ExportView from './components/tabs/ExportView.vue';
import External from './components/tabs/External.vue';
import FilterView from './components/tabs/FilterView.vue';
import PaletteView from './components/tabs/PaletteView.vue';
import LogView from './components/tabs/LogView.vue';

// other components
import GridSchedule from './components/GridSchedule.vue';
import Pagination from './components/Pagination.vue';
import CourseModal from './components/CourseModal.vue';
import SectionModal from './components/SectionModal.vue';

import { loadBuildingList, loadTimeMatrix } from './data/BuildingLoader';
import Store, { SemesterStorage } from './store';

import param from './config';
import { SemesterJSON } from './models/Catalog';

@Component({
    components: {
        ClassView,
        FuzzyView,
        EventView,
        DisplayView,
        FilterView,
        PaletteView,
        ExportView,
        Pagination,
        GridSchedule,
        SectionModal,
        CourseModal,
        // use dynamic component for this one because it is relatively large in size
        Information: () => import('./components/tabs/Information.vue'),
        External,
        LogView
    }
})
export default class App extends Store {
    get sideBar() {
        return this.status.sideBar;
    }
    get scheduleWidth() {
        return this.status.sideBarActive
            ? 100 - param.sideBarWidth - param.tabBarWidth - param.sideMargin
            : 100 - param.tabBarWidth - param.sideMargin;
    }
    get scheduleLeft() {
        return this.status.sideBarActive
            ? param.sideBarWidth + param.tabBarWidth + 1
            : param.tabBarWidth;
    }

    scrollable = false;

    /**
     * @todo
     */
    async loadConfigFromURL() {
        const config = new URLSearchParams(window.location.search).get('config');

        if (config) {
            let raw_data: SemesterStorage, result;
            try {
                result = lz.decompressFromEncodedURIComponent(config);
                raw_data = JSON.parse(result);
            } catch (error) {
                console.error(error);
                this.noti.error(error.message + ': File Format Error');
                return;
            }
            localStorage.setItem(raw_data.currentSemester.id, result);
            await this.selectSemester(raw_data.currentSemester);
            this.noti.success('Configuration loaded from URL!', 3, true);
        }
    }

    /**
     * initialize profile storage if it does not exist already
     */
    initProfiles() {
        const { semesters } = this.semester;
        if (!semesters.length) return;

        const name = localStorage.getItem('currentProfile');
        const profiles = [];
        if (!name) {
            for (const sem of semesters.concat().reverse()) {
                const oldData = localStorage.getItem(sem.id);
                if (oldData) {
                    localStorage.setItem(sem.name, oldData);
                    localStorage.removeItem(sem.id);
                    profiles.push(sem.name);
                }
            }

            // latest semester
            const latest = semesters[0].name;
            localStorage.setItem('currentProfile', latest);
            if (!profiles.includes(latest)) profiles.push(latest);

            localStorage.setItem('profiles', JSON.stringify(profiles));
        }
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
            this.initProfiles();
            await this.loadProfile(localStorage.getItem('currentProfile') || '');
        }

        this.status.loading = false;
    }
}
