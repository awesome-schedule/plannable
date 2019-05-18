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
import displaySettings, { DisplayState, defaultDisplay } from './store/display';
import { noti } from './store/notification';

import { Vue, Component, Watch } from 'vue-property-decorator';
import ClassList from './components/ClassList.vue';
import Pagination from './components/Pagination.vue';
import GridSchedule from './components/GridSchedule.vue';
import SectionModal from './components/SectionModal.vue';
import CourseModal from './components/CourseModal.vue';
import Palette from './components/Palette.vue';
import EventView from './components/EventView.vue';
import Information from './components/Information.vue';
import External from './components/External.vue';
import draggable from 'vuedraggable';

import Course from './models/Course';
import Schedule, { ScheduleJSON } from './models/Schedule';
import { Semester } from './models/Catalog';
import Event from './models/Event';
import ScheduleGenerator from './algorithm/ScheduleGenerator';
import ScheduleEvaluator from './algorithm/ScheduleEvaluator';
import { loadSemesterData } from './data/CatalogLoader';
import { loadSemesterList } from './data/SemesterListLoader';
import { loadTimeMatrix, loadBuildingList } from './data/BuildingLoader';
import { to12hr, savePlain } from './utils';
import Meta, { getDefaultData } from './models/Meta';
import { toICal } from './utils/ICal';

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
        ClassList,
        Pagination,
        GridSchedule,
        SectionModal,
        CourseModal,
        draggable,
        Palette,
        EventView,
        Information,
        External
    }
})
export default class App extends Vue {
    [x: string]: any;
    semesters: Semester[] = [];
    currentSemester: Semester | null = null;
    /**
     * the index of the current schedule in the scheduleEvaluator.schedules array,
     * only applicable when generated=true
     */
    currentScheduleIndex = 0;
    /**
     * currently rendered schedule
     */
    currentSchedule = new Schedule();
    /**
     * the array of proposed schedules
     */
    proposedSchedules = [new Schedule()];
    /**
     * the index of the active proposed
     */
    proposedScheduleIndex = 0;
    /**
     * The index of the proposed schedule corresponding to the generated schedule
     */
    cpIndex = -1;
    /**
     * indicates whether the currently showing schedule is the generated schedule
     */
    generated = false;

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

    // autocompletion related fields
    isEntering = false;
    inputCourses: Course[] | null = null;

    // display options
    display: DisplayState = Object.assign({}, defaultDisplay);

    // filter settings
    /**
     * index 0 - 4: whether Mo - Tu are selected
     *
     * 6: start time, of 24 hour format
     *
     * 7: end time, of 24 hour format
     */
    timeSlots: Array<[boolean, boolean, boolean, boolean, boolean, string, string]> = [];
    allowWaitlist = true;
    allowClosed = true;
    sortOptions = ScheduleEvaluator.getDefaultOptions();
    sortModes = ScheduleEvaluator.sortModes;

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
    /**
     * get the list of current ids, sorted in alphabetical order of the keys
     */
    get currentIds(): Array<[string, string]> {
        return Object.entries(this.currentSchedule.currentIds).sort((a, b) =>
            a[0] === b[0] ? 0 : a[0] < b[0] ? -1 : 1
        );
    }
    set proposedSchedule(schedule: Schedule) {
        // need Vue's reactivity
        this.$set(this.proposedSchedules, this.proposedScheduleIndex, schedule);
    }
    /**
     * the proposed schedule that is currently active
     */
    get proposedSchedule() {
        return this.proposedSchedules[this.proposedScheduleIndex];
    }

    @Watch('loading')
    loadingWatch() {
        if (this.mobile) {
            if (this.loading) noti.info('Loading...', 3600);
            else noti.clear();
        }
    }

    @Watch('display', { deep: true })
    displayWatch() {
        displaySettings.update(this.display);
    }

    @Watch('display.multiSelect')
    multiSelectWatch() {
        this.currentSchedule.computeSchedule();
    }

    @Watch('display.combineSections')
    combineSectionsWatch() {
        if (this.generated) this.generateSchedules();
        this.currentSchedule.computeSchedule();
    }

    created() {
        this.loading = true;

        (async () => {
            // note: these three can be executed in parallel, i.e. they are not inter-dependent
            const [pay1, pay2, pay3] = await Promise.all([
                loadTimeMatrix(),
                loadBuildingList(),
                loadSemesterList()
            ]);
            console[pay1.level](pay1.msg);
            if (pay1.payload) window.timeMatrix = pay1.payload;

            console[pay2.level](pay2.msg);
            if (pay2.payload) window.buildingList = pay2.payload;

            const semesters = pay3.payload;
            if (pay3.level !== 'info') noti.notify(pay3);
            console[pay3.level](pay3.msg);

            if (semesters) {
                window.semesters = this.semesters = semesters;
                await this.selectSemester(0);
            }
            this.loading = false;
        })();
    }
    clearNoti() {
        noti.clear();
    }
    /**
     * whether there're schedules generated. Because script between <template>
     * tag cannot access global objects, we need a method
     */
    generatedEmpty() {
        return window.scheduleEvaluator.empty();
    }
    /**
     * switch to next or previous proposed schedule. has bound checking.
     */
    switchProposed(index: number) {
        if (index < this.proposedSchedules.length && index >= 0) {
            this.proposedScheduleIndex = index;
            this.switchSchedule(false);
        }
        this.saveStatus();
    }
    newProposed() {
        this.proposedSchedules.push(new Schedule());
        this.switchProposed(this.proposedSchedules.length - 1);
    }
    /**
     * copy the current schedule and append to the proposedSchedule array.
     * Immediately switch to the last proposed schedule.
     */
    copyCurrent() {
        const len = this.proposedSchedules.length;
        this.proposedSchedules.push(this.proposedSchedule.copy());
        this.switchProposed(len);
    }
    deleteProposed() {
        if (this.proposedSchedules.length === 1) return;
        const idx = this.proposedScheduleIndex;

        if (!confirm(`Are you sure to delete schedule ${idx + 1}?`)) return;

        // if the schedule to be deleted corresponds to generated schedules,
        // this deletion invalidates the generated schedules immediately.
        if (idx === this.cpIndex) {
            window.scheduleEvaluator.clear();
            this.cpIndex = -1;
        }
        this.proposedSchedules.splice(idx, 1);
        if (idx >= this.proposedSchedules.length) {
            this.switchProposed(idx - 1);
        } else {
            this.switchProposed(idx);
        }
        this.saveStatus();
    }
    editEvent(event: Event) {
        if (!this.sideBar.showEvent) this.switchSideBar('showEvent');
        this.eventToEdit = event;
    }
    switchSchedule(generated: boolean) {
        if (generated) {
            // don't do anything if already in "generated" mode
            // or there are no generated schedules
            // or the generated schedules do not correspond to the current schedule
            if (
                !this.generated &&
                !window.scheduleEvaluator.empty() &&
                this.cpIndex === this.proposedScheduleIndex
            ) {
                this.generated = true;
                this.proposedSchedule = this.currentSchedule;
                this.switchPage(
                    this.currentScheduleIndex === null ? 0 : this.currentScheduleIndex,
                    true
                );
            }
        } else {
            this.generated = false;
            this.currentSchedule = this.proposedSchedule;
        }
    }
    updateFilterDay(i: number, j: number) {
        this.$set(this.timeSlots[i], j, !this.timeSlots[i][j]);
    }
    switchSideBar(key: string) {
        this.getClass('');
        for (const other in this.sideBar) {
            if (other !== key) this.sideBar[other] = false;
        }
        this.sideBar[key] = !this.sideBar[key];

        if (this.sideBar.showSelectColor) this.switchSchedule(true);
    }
    onDocChange() {
        this.saveStatus();
    }
    print() {
        window.print();
    }
    clear() {
        this.currentSchedule.clean();
        this.proposedSchedule.clean();
        this.generated = false;
        window.scheduleEvaluator.clear();
        this.cpIndex = -1;
        this.saveStatus();
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

    removeCourse(key: string) {
        this.currentSchedule.remove(key);
        if (this.generated) {
            noti.warn(`You're editing the generated schedule!`, 3);
        } else {
            this.saveStatus();
        }
    }
    /**
     * @see Schedule.update
     */
    updateCourse(key: string, section: number, remove: boolean = false) {
        this.currentSchedule.update(key, section, remove);
        if (this.generated) {
            noti.warn(`You're editing the generated schedule!`, 3);
        } else {
            this.saveStatus();
        }
        // note: adding a course to schedule.All cannot be detected by Vue.
        // Must use forceUpdate to re-render component
        (this.$refs.selectedClassList as Vue).$forceUpdate();
        const classList = this.$refs.enteringClassList;
        if (classList instanceof Vue) (classList as Vue).$forceUpdate();
    }
    /**
     * Switch to `idx` page. If update is true, also update the pagination status.
     * @param idx
     * @param update  whether to update the pagination status
     */
    switchPage(idx: number, update = false) {
        if (0 <= idx && idx < window.scheduleEvaluator.size()) {
            this.currentScheduleIndex = idx;
            if (update) {
                this.tempScheduleIndex = idx;
            } else {
                this.tempScheduleIndex = null;
            }
            this.currentSchedule = window.scheduleEvaluator.getSchedule(idx);
            this.saveStatus();
        }
    }
    /**
     * get classes that match the input query.
     * Exit "entering" mode on falsy parameter (set `isEntering` to false)
     *
     * @see Catalog.search
     */
    getClass(query: string) {
        if (!query) {
            this.isEntering = false;
            this.inputCourses = null;
            return;
        }
        // if current schedule is displayed, switch to proposed schedule
        // because we're adding stuff to the proposed schedule
        if (this.generated) {
            this.switchSchedule(false);
        }
        this.inputCourses = window.catalog.search(query);
        this.isEntering = true;
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
        // do a linear search to find the index of the semester given its string id
        if (typeof semesterId === 'string') {
            for (let i = 0; i < this.semesters.length; i++) {
                const semester = this.semesters[i];
                if (semester.id === semesterId) {
                    semesterId = i;
                    break;
                }
            }
            // not found: return
            if (typeof semesterId === 'string') return;
        }

        this.currentSemester = this.semesters[semesterId];
        this.loading = true;

        if (force) noti.info(`Updating ${this.currentSemester.name} data...`);
        const result = await loadSemesterData(semesterId, force);
        if (result.level !== 'info') noti.notify(result);
        console[result.level](result.msg);

        //  if the a catalog object is returned
        if (result.payload) {
            window.catalog = result.payload;
            this.lastUpdate = new Date(window.catalog.modified).toLocaleString();
            const data = localStorage.getItem(this.currentSemester.id);

            let raw_data: { [x: string]: any } = {};
            if (parsed_data) {
                raw_data = parsed_data;
            } else if (data) {
                raw_data = JSON.parse(data);
            }

            this.generated = false;
            window.scheduleEvaluator.clear();
            this.parseLocalData(raw_data);
            this.loading = false;
        }
    }
    closeClassList() {
        (this.$refs.classSearch as HTMLInputElement).value = '';
        this.getClass('');
    }
    generateSchedules() {
        if (this.generated) this.currentSchedule = this.proposedSchedule;
        this.generated = false;

        if (this.currentSchedule.empty())
            return noti.warn(`There are no classes in your schedule!`);

        const status = [];
        if (!this.allowWaitlist) status.push('Wait List');
        if (!this.allowClosed) status.push('Closed');

        const timeSlots = this.computeFilter();

        // null means there's an error processing time filters. Don't continue if that's the case
        if (timeSlots === null) {
            noti.error(`Invalid time filter`);
            return;
        }

        if (!this.validateSortOptions()) return;

        this.loading = true;
        const generator = new ScheduleGenerator(window.catalog, window.buildingList);
        try {
            const evaluator = generator.getSchedules(this.currentSchedule, {
                events: this.currentSchedule.events,
                timeSlots,
                status,
                sortOptions: this.sortOptions,
                combineSections: this.display.combineSections,
                maxNumSchedules: this.display.maxNumSchedules
            });
            window.scheduleEvaluator.clear();
            window.scheduleEvaluator = evaluator;
            this.saveStatus();
            noti.success(`${window.scheduleEvaluator.size()} Schedules Generated!`, 3);
            this.cpIndex = this.proposedScheduleIndex;
            this.switchSchedule(true);
            this.loading = false;
        } catch (err) {
            console.warn(err);
            this.generated = false;
            window.scheduleEvaluator.clear();
            noti.error(err.message);
            this.saveStatus();
            this.cpIndex = -1;
            this.loading = false;
        }
    }

    validateSortOptions() {
        if (!Object.values(this.sortOptions.sortBy).some(x => x.enabled)) {
            noti.error('You must have at least one sort option!');
            return false;
        } else if (
            Object.values(this.sortOptions.sortBy).some(x => x.name === 'distance' && x.enabled) &&
            (!window.buildingList || !window.timeMatrix)
        ) {
            noti.error('Building list fails to load. Please disable "walking distance"');
            return false;
        }
        return true;
    }

    changeSorting(optIdx?: number) {
        if (!this.validateSortOptions()) return;
        if (optIdx !== undefined) {
            const option = this.sortOptions.sortBy[optIdx];

            if (option.enabled) {
                // disable options that are mutually exclusive to this one
                for (const key of option.exclusive) {
                    for (const opt of this.sortOptions.sortBy) {
                        if (opt.name === key) opt.enabled = false;
                    }
                }
            }
        }
        if (!window.scheduleEvaluator.empty()) {
            this.loading = true;
            window.scheduleEvaluator.changeSort(this.sortOptions, true);
            if (!this.generated) {
                this.switchSchedule(true);
            } else {
                // re-assign the current schedule
                this.currentSchedule = window.scheduleEvaluator.getSchedule(
                    this.currentScheduleIndex
                );
            }
            this.loading = false;
        }
    }

    saveStatus() {
        if (!this.currentSemester) return;

        const obj: { [x: string]: any } = Object.create(null);
        for (const field of Meta.storageFields) {
            obj[field] = this[field];
        }
        obj.storageVersion = Meta.storageVersion;
        // note: toJSON() will automatically be called if such method exists on an object
        localStorage.setItem(this.currentSemester.id, JSON.stringify(obj));
    }
    /**
     * parse schedules and settings stored locally for currentSemester.
     * Use default value for fields that do not exist on local data.
     */
    parseLocalData(raw_data: { [x: string]: any }) {
        const defaultData = getDefaultData();
        for (const field of Meta.storageFields) {
            if (field === 'currentSemester') continue;
            if (field === 'proposedSchedules') {
                // if true, we're dealing with legacy storage
                if (raw_data.proposedSchedule) {
                    this.proposedScheduleIndex = 0;
                    const s = Schedule.fromJSON(raw_data.proposedSchedule);
                    if (s) this.proposedSchedule = s;
                } else {
                    const schedules: ScheduleJSON[] | undefined = raw_data.proposedSchedules;
                    if (schedules && schedules.length) {
                        const propSchedules = [];
                        for (const schedule of schedules) {
                            const temp = Schedule.fromJSON(schedule);
                            if (temp) propSchedules.push(temp);
                        }

                        if (propSchedules.length) this.proposedSchedules = propSchedules;
                        else this.proposedSchedules = defaultData.proposedSchedules;
                        this.proposedScheduleIndex =
                            raw_data.proposedScheduleIndex === undefined
                                ? 0
                                : raw_data.proposedScheduleIndex;
                    } else {
                        this.proposedSchedules = defaultData[field];
                    }
                }
            } else if (this[field] instanceof Array) {
                const raw_arr = raw_data[field];
                if (raw_arr instanceof Array) {
                    this[field] = raw_arr;
                } else this[field] = defaultData[field];
            } else if (this[field] instanceof Object) {
                if (!raw_data[field]) {
                    this[field] = defaultData[field];
                    continue;
                }
                if (typeof this[field].fromJSON === 'function') {
                    const parsed = this[field].fromJSON(raw_data[field]);
                    if (parsed) this[field] = parsed;
                    else {
                        // noti.warn(`Fail to parse ${field}`);
                        // console.warn('failed to parse', field);
                        this[field] = defaultData[field];
                    }
                } else {
                    if (
                        Object.keys(this[field])
                            .sort()
                            .toString() ===
                        Object.keys(raw_data[field])
                            .sort()
                            .toString()
                    )
                        this[field] = raw_data[field];
                    else this[field] = defaultData[field];
                }
            } else if (typeof raw_data[field] === typeof this[field]) this[field] = raw_data[field];
            else {
                this[field] = defaultData[field];
            }
        }
        if (!this.proposedSchedule.empty()) {
            console.log('generating schedules from local data..');
            this.currentSchedule = this.proposedSchedule;
            this.generateSchedules();
        }
    }
    removeTimeSlot(n: number) {
        this.timeSlots.splice(n, 1);
    }
    addTimeSlot() {
        this.timeSlots.push([false, false, false, false, false, '', '']);
    }
    /**
     * Preprocess the time filters and convert them to array of event.
     * returns null on parsing error
     */
    computeFilter(): Event[] | null {
        const timeSlotsRecord = [];
        for (const time of this.timeSlots) {
            let days = '';
            for (let j = 0; j < 5; j++) {
                if (time[j]) days += Meta.days[j];
            }

            if (!days) continue;

            const startTime = time[5].split(':');
            const endTime = time[6].split(':');
            if (
                isNaN(+startTime[0]) ||
                isNaN(+startTime[1]) ||
                isNaN(+endTime[0]) ||
                isNaN(+endTime[1])
            ) {
                noti.error('Invalid time input.');
                return null;
            }
            days += ' ' + to12hr(time[5]) + ' - ' + to12hr(time[6]);
            timeSlotsRecord.push(new Event(days, false));
        }
        return timeSlotsRecord;
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
                localStorage.setItem((this.currentSemester as Semester).id, result);
                const semester: Semester = raw_data.currentSemester;
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
