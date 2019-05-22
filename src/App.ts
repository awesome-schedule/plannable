/**
 * the "view" of this project; the root Vue component that contains almost all of the child components and DOM
 * elements of the main webpage.
 * @author Hanzhi Zhou, Kaiying Shan, Elena Long
 */

/**
 *
 */
import { createDecorator } from 'vue-class-component';
import { ComputedOptions } from 'vue';
import { display, Display } from './store/display';
import { noti } from './store/notification';

import { Vue, Component, Watch } from 'vue-property-decorator';
import ClassView from './components/ClassView.vue';
import FilterView from './components/FilterView.vue';
import DisplayView from './components/DisplayView.vue';
import Pagination from './components/Pagination.vue';
import GridSchedule from './components/GridSchedule.vue';
import SectionModal from './components/SectionModal.vue';
import CourseModal from './components/CourseModal.vue';
import Palette from './components/Palette.vue';
import EventView from './components/EventView.vue';
import Information from './components/Information.vue';
import External from './components/External.vue';

import { SemesterJSON } from './models/Catalog';
import Event from './models/Event';
import ScheduleEvaluator from './algorithm/ScheduleEvaluator';
import { loadTimeMatrix, loadBuildingList } from './data/BuildingLoader';
import { savePlain, toICal } from './utils';
import Meta from './models/Meta';
import semester from './store/semester';
import filter from './store/filter';
import schedule from './store/schedule';
import { saveStatus } from './store/helper';

// these two properties must be non-reactive,
// otherwise the reactive observer will slow down execution significantly
window.scheduleEvaluator = new ScheduleEvaluator();
// window.catalog = null;

export const NoCache = createDecorator((options, key) => {
    // component options should be passed to the callback
    // and update for the options object affect the component
    (options.computed![key] as ComputedOptions<any>).cache = false;
});

@Component({
    components: {
        ClassView,
        DisplayView,
        FilterView,
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
export default class App extends Vue {
    [x: string]: any;

    /**
     * sidebar display status
     * show the specific sidebar when true, and hide when all false
     */
    sideBar: { [x: string]: boolean } = {
        showSelectClass: window.screen.width / window.screen.height > 1 ? true : false,
        showEvent: false,
        showFilter: false,
        showSetting: false,
        showExport: false,
        showSelectColor: false,
        showInfo: false,
        showExternal: false
    };

    // display options
    get display() {
        return display;
    }
    get filter() {
        return filter;
    }
    get noti() {
        return noti;
    }
    get currentSemester() {
        return semester.currentSemester;
    }
    get semesters() {
        return semester.semesters;
    }
    get schedule() {
        return schedule;
    }

    // other
    loading = false;
    mobile = window.screen.width < 900;
    sideBarWidth = this.mobile ? 10 : 3;
    scrollable = false;
    tempScheduleIndex: number | null = null;
    days = Meta.days;
    eventToEdit: Event | null = null;
    exportJson: string = 'schedule';
    exportICal: string = 'schedule';
    lastUpdate: string = '';

    get sideBarActive() {
        for (const key in this.sideBar) {
            if (this.sideBar[key]) return true;
        }
        return false;
    }

    @NoCache
    get scheduleLength() {
        return window.scheduleEvaluator.size();
    }
    get scheduleWidth() {
        return this.sideBarActive ? 100 - 19 - 3 - 3 : 100 - 3 - 3;
    }
    get scheduleLeft() {
        return this.sideBarActive ? 23 : 3;
    }

    @Watch('loading')
    loadingWatch() {
        if (this.mobile) {
            if (this.loading) noti.info('Loading...', 3600);
            else noti.clear();
        }
    }

    @Watch('display.multiSelect')
    multiSelectWatch() {
        this.currentSchedule.computeSchedule();
    }

    created() {
        this.loading = true;

        (async () => {
            // note: these three can be executed in parallel, i.e. they are not inter-dependent
            const [pay1, pay2, pay3] = await Promise.all([
                loadTimeMatrix(),
                loadBuildingList(),
                semester.loadSemesters()
            ]);
            console[pay1.level](pay1.msg);
            if (pay1.payload) window.timeMatrix = pay1.payload;

            console[pay2.level](pay2.msg);
            if (pay2.payload) window.buildingList = pay2.payload;

            if (pay3) {
                await semester.selectSemester(0);
            }
            this.loading = false;
        })();
    }
    editEvent(event: Event) {
        if (!this.sideBar.showEvent) this.switchSideBar('showEvent');
        this.eventToEdit = event;
    }
    switchSideBar(key: string) {
        for (const other in this.sideBar) {
            if (other !== key) this.sideBar[other] = false;
        }
        this.sideBar[key] = !this.sideBar[key];

        if (this.sideBar.showSelectColor) schedule.switchSchedule(true);
    }
    onDocChange() {
        saveStatus();
    }
    print() {
        window.print();
    }

    clearCache() {
        if (confirm('Your selected classes and schedules will be cleaned. Are you sure?')) {
            this.currentSchedule.clean();
            this.generated = false;
            window.scheduleEvaluator.clear();
            localStorage.clear();
            this.cpIndex = -1;
        }
    }

    onUploadJson(event: { target: EventTarget | null }) {
        const input = event.target as HTMLInputElement;

        if (!input.files) return;

        const reader = new FileReader();
        reader.onload = () => {
            if (reader.result) {
                let raw_data, result;
                try {
                    result = reader.result.toString();
                    raw_data = JSON.parse(result);
                } catch (error) {
                    console.error(error);
                    noti.error(error.message + ': File Format Error');
                    return;
                }
                localStorage.setItem((this.currentSemester as SemesterJSON).id, result);
                const semester: SemesterJSON = raw_data.currentSemester;
                this.selectSemester(semester.id, raw_data);
            } else {
                noti.warn('File is empty!');
            }
        };

        try {
            reader.readAsText(input.files[0]);
        } catch (error) {
            console.warn(error);
            noti.error(error.message);
        }
    }
    saveToJson() {
        if (!this.currentSemester) return;
        const json = localStorage.getItem(this.currentSemester.id);
        if (json) savePlain(json, (this.exportJson ? this.exportJson : 'schedule') + '.json');
    }
    saveToIcal() {
        savePlain(
            toICal(this.currentSchedule),
            (this.exportICal ? this.exportICal : 'schedule') + '.ical'
        );
    }
}
