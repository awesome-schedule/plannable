/**
 * the "view" of this project; the root Vue component that contains almost all of the child components and DOM
 * elements of the main webpage.
 * @author Hanzhi Zhou, Kaiying Shan, Elena Long
 */

/**
 *
 */
import { Component } from 'vue-property-decorator';
import ClassView from './components/tabs/ClassView.vue';
import DisplayView from './components/tabs/DisplayView.vue';
import EventView from './components/tabs/EventView.vue';
import FuzzyView from './components/tabs/FuzzyView.vue';
import ExportView from './components/tabs/ExportView.vue';
import External from './components/tabs/External.vue';
import FilterView from './components/tabs/FilterView.vue';
import PaletteView from './components/tabs/PaletteView.vue';
import LogView from './components/tabs/LogView.vue';
import mobile from './components/Mobile';

import GridSchedule from './components/GridSchedule.vue';
import Pagination from './components/Pagination.vue';
import CourseModal from './components/CourseModal.vue';
import SectionModal from './components/SectionModal.vue';

import { loadBuildingList, loadTimeMatrix } from './data/BuildingLoader';
import Store from './store';

import param from './AppConfig.json';

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

    tabBarWidth = mobile.isMobile ? param.tabBarWidthMobile : param.tabBarWidth;
    scrollable = false;
    classMobile = mobile.classMobile;
    mobile = mobile.isMobile;

    created() {
        this.status.loading = true;

        (async () => {
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
            if (pay3.payload) await this.selectSemester(this.semester.semesters[0]);
            this.status.loading = false;
        })();
    }
}
