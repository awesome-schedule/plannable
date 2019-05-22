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

import Schedule, { ScheduleJSON } from './models/Schedule';
import { SemesterJSON } from './models/Catalog';
import Event from './models/Event';
import ScheduleEvaluator from './algorithm/ScheduleEvaluator';
import { loadTimeMatrix, loadBuildingList } from './data/BuildingLoader';
import { savePlain, toICal } from './utils';
import Meta from './models/Meta';
import semester from './store/semester';
import filter, { FilterState } from './store/filter';
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
                await this.selectSemester(0);
            }
            this.loading = false;
        })();
    }
    editEvent(event: Event) {
        if (!this.sideBar.showEvent) this.switchSideBar('showEvent');
        this.eventToEdit = event;
    }
    switchSideBar(key: string) {
        // schedule.getClass('');
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

    /**
     * Select a semester and fetch all its associated data.
     *
     * This method will assign a correct Catalog object to `window.catalog`
     *
     * Then, schedules and settings will be parsed from `localStorage`
     * and assigned to relevant fields of `this`.
     *
     * If no local data is present, default values will be assigned.
     *
     * @param semesterId index or id of this semester
     * @param parsed_data
     * @param force whether to force-update semester data
     */
    async selectSemester(
        semesterId: number | string,
        parsed_data?: { [x: string]: any },
        force = false
    ) {
        const result = await semester.selectSemester(semesterId, force);
        if (result) {
            const data = localStorage.getItem(this.currentSemester!.id);

            // let raw_data: { [x: string]: any } = {};
            // if (parsed_data) {
            //     raw_data = parsed_data;
            // } else if (data) {
            //     raw_data = JSON.parse(data);
            // }

            // this.generated = false;
            // window.scheduleEvaluator.clear();
            // this.parseLocalData(raw_data);
            // this.loading = false;
        }
    }

    // /**
    //  * parse schedules and settings stored locally for currentSemester.
    //  * Use default value for fields that do not exist on local data.
    //  */
    // parseLocalData(raw_data: { [x: string]: any }) {
    //     const defaultData = getDefaultData();
    //     for (const field of Meta.storageFields) {
    //         if (field === 'currentSemester') continue;
    //         if (field === 'proposedSchedules') {
    //             // if true, we're dealing with legacy storage
    //             if (raw_data.proposedSchedule) {
    //                 this.proposedScheduleIndex = 0;
    //                 const s = Schedule.fromJSON(raw_data.proposedSchedule);
    //                 if (s) this.proposedSchedule = s;
    //             } else {
    //                 const schedules: ScheduleJSON[] | undefined = raw_data.proposedSchedules;
    //                 if (schedules && schedules.length) {
    //                     const propSchedules = [];
    //                     for (const schedule of schedules) {
    //                         const temp = Schedule.fromJSON(schedule);
    //                         if (temp) propSchedules.push(temp);
    //                     }

    //                     if (propSchedules.length) this.proposedSchedules = propSchedules;
    //                     else this.proposedSchedules = defaultData.proposedSchedules;
    //                     this.proposedScheduleIndex =
    //                         raw_data.proposedScheduleIndex === undefined
    //                             ? 0
    //                             : raw_data.proposedScheduleIndex;
    //                 } else {
    //                     this.proposedSchedules = defaultData[field];
    //                 }
    //             }
    //         } else if (this[field] instanceof Array) {
    //             const raw_arr = raw_data[field];
    //             if (raw_arr instanceof Array) {
    //                 this[field] = raw_arr;
    //             } else this[field] = defaultData[field];
    //         } else if (this[field] instanceof Object) {
    //             if (!raw_data[field]) {
    //                 this[field] = defaultData[field];
    //                 continue;
    //             }
    //             if (typeof this[field].fromJSON === 'function') {
    //                 const parsed = this[field].fromJSON(raw_data[field]);
    //                 if (parsed) this[field] = parsed;
    //                 else {
    //                     // noti.warn(`Fail to parse ${field}`);
    //                     // console.warn('failed to parse', field);
    //                     this[field] = defaultData[field];
    //                 }
    //             } else {
    //                 if (
    //                     Object.keys(this[field])
    //                         .sort()
    //                         .toString() ===
    //                     Object.keys(raw_data[field])
    //                         .sort()
    //                         .toString()
    //                 )
    //                     this[field] = raw_data[field];
    //                 else this[field] = defaultData[field];
    //             }
    //         } else if (typeof raw_data[field] === typeof this[field]) this[field] = raw_data[field];
    //         else {
    //             this[field] = defaultData[field];
    //         }
    //     }
    //     if (!this.proposedSchedule.empty()) {
    //         console.log('generating schedules from local data..');
    //         this.currentSchedule = this.proposedSchedule;
    //         this.generateSchedules();
    //     }
    // }
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
