/**
 * the "view" of this project; the root Vue component that contains almost all of the child components and DOM
 * elements of the main webpage.
 * @author Hanzhi Zhou, Kaiying Shan, Elena Long
 */

/**
 *
 */
import { Component } from 'vue-property-decorator';
import ScheduleEvaluator from './algorithm/ScheduleEvaluator';
import ClassView from './components/ClassView.vue';
import CourseModal from './components/CourseModal.vue';
import DisplayView from './components/DisplayView.vue';
import EventView from './components/EventView.vue';
import ExportView from './components/ExportView.vue';
import External from './components/External.vue';
import FilterView from './components/FilterView.vue';
import GridSchedule from './components/GridSchedule.vue';
import Information from './components/Information.vue';
import Pagination from './components/Pagination.vue';
import Palette from './components/Palette.vue';
import SectionModal from './components/SectionModal.vue';
import { loadBuildingList, loadTimeMatrix } from './data/BuildingLoader';
import Store from './store';
import filter from './store/filter';

// these two properties must be non-reactive,
// otherwise the reactive observer will slow down execution significantly
window.scheduleEvaluator = new ScheduleEvaluator(filter.sortOptions);
// window.catalog = null;

@Component({
    components: {
        ClassView,
        DisplayView,
        FilterView,
        ExportView,
        Pagination,
        GridSchedule,
        SectionModal,
        CourseModal,
        Palette,
        EventView,
        Information,
        External
    }
})
export default class App extends Store {
    get sideBar() {
        return this.status.sideBar;
    }
    get scheduleWidth() {
        return this.status.sideBarActive ? 100 - 19 - 3 - 3 : 100 - 3 - 3;
    }
    get scheduleLeft() {
        return this.status.sideBarActive ? 23 : 3;
    }

    mobile = window.screen.width < 900;
    sideBarWidth = this.mobile ? 10 : 3;
    scrollable = false;

    created() {
        this.status.loading = true;

        (async () => {
            // note: these three can be executed in parallel, i.e. they are not inter-dependent
            const [pay1, pay2, pay3] = await Promise.all([
                loadTimeMatrix(),
                loadBuildingList(),
                this.semester.loadSemesters()
            ]);
            console[pay1.level](pay1.msg);
            if (pay1.payload) window.timeMatrix = pay1.payload;

            console[pay2.level](pay2.msg);
            if (pay2.payload) window.buildingList = pay2.payload;

            if (pay3) await this.selectSemester(this.semester.semesters[0]);
            this.status.loading = false;
        })();
    }
}
