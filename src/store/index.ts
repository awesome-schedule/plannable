/**
 * The Store module provides methods to save, retrieve and manipulate store.
 * It gathers all children modules and store their references in a single store class,
 * which is provided as a Mixin
 * @module store
 * @preferred
 */

/**
 *
 */
import Vue from 'vue';
import { Component, Watch } from 'vue-property-decorator';
import { EvaluatorOptions } from '../algorithm/ScheduleEvaluator';
import ScheduleGenerator, { GeneratorOptions } from '../algorithm/ScheduleGenerator';
import { SemesterJSON } from '../models/Catalog';
import { CourseStatus } from '../models/Meta';
import Schedule, { ScheduleJSON } from '../models/Schedule';
import display, { DisplayState } from './display';
import filter, { FilterStateJSON } from './filter';
import modal from './modal';
import noti from './notification';
import palette, { PaletteState } from './palette';
import profile from './profile';
import schedule, { ScheduleStateJSON } from './schedule';
import semester, { SemesterState } from './semester';
import status from './status';

export interface SemesterStorage {
    name: string;
    currentSemester: SemesterJSON;
    display: DisplayState;
    filter: FilterStateJSON;
    schedule: ScheduleStateJSON;
    palette: PaletteState;
}

interface LegacyScheduleJSON extends ScheduleJSON {
    savedColors: { [x: string]: string };
}

/**
 * the storage format prior to v4.5
 */
export interface LegacyStorage {
    currentSemester: SemesterJSON;
    currentScheduleIndex: number;
    proposedScheduleIndex: number;
    cpIndex: number;
    currentSchedule: LegacyScheduleJSON;
    proposedSchedules: LegacyScheduleJSON[];

    display: DisplayState;

    timeSlots: [boolean, boolean, boolean, boolean, boolean, string, string][];
    allowWaitlist: boolean;
    allowClosed: boolean;
    sortOptions: EvaluatorOptions;
}

/**
 * the storage format prior to v3.0
 */
export interface AncientStorage extends DisplayState {
    currentSemester: SemesterJSON;
    currentScheduleIndex: number;
    currentSchedule: LegacyScheduleJSON;
    proposedSchedule: LegacyScheduleJSON;

    timeSlots: [boolean, boolean, boolean, boolean, boolean, string, string][];
    allowWaitlist: boolean;
    allowClosed: boolean;
    sortOptions: EvaluatorOptions;
}

interface StorageItem<State, JSONState> {
    /**
     * a method to obtain the default state
     */
    getDefault(): State;
    /**
     * serialize `this` (the store module) to its JSON representation
     */
    toJSON(this: StoreModule<State, JSONState>): JSONState;
    /**
     * recover the state from its JSON representation
     *
     * An object that has all or some properties of the `JSONState` will be passed as a parameter.
     * The missing properties will be assigned with the value returned by the `getDefault` method.
     */
    fromJSON(obj: Partial<JSONState>): void;
}

/**
 * A Store Module must have
 * @typeparam State
 * @typeparam JSONState the JSON representation of its state
 *
 * and the three methods defined by [[StorageItem]]
 */
export type StoreModule<State, JSONState> = State & StorageItem<State, JSONState>;

/**
 * save all store modules to localStorage
 */
export function saveStatus(name?: string) {
    const { currentSemester } = semester;
    if (!currentSemester) return;
    if (!name) name = profile.current;
    if (!name) return;

    const obj: SemesterStorage = {
        name,
        currentSemester,
        display,
        filter,
        schedule: schedule.toJSON(),
        palette
    };

    localStorage.setItem(name, JSON.stringify(obj));
}

const jobs: { [x: string]: string } = {};

/**
 * a decorator that delays the execution of a **method** and store the handler in [[jobs]],
 * cancel all subsequent calls in the meantime
 * @param timeout delay in millisecond
 */
function delay(timeout: number) {
    return (
        target: any,
        propertyKey: string,
        descriptor: TypedPropertyDescriptor<(...args: any[]) => void>
    ) => {
        const oldVal = descriptor.value!;
        descriptor.value = function(...args: any[]) {
            if (jobs[propertyKey]) {
                console.log('cancelled: ', propertyKey);
                return;
            }
            jobs[propertyKey] = propertyKey;
            window.setTimeout(() => {
                oldVal.apply(this, args);
                delete jobs[propertyKey];
            }, timeout);
        };
    };
}

function isAncient(parsed: any): parsed is AncientStorage {
    return !!parsed.currentSchedule && !!parsed.proposedSchedule;
}

function isLegacy(parsed: any): parsed is LegacyStorage {
    return !!parsed.currentSchedule && !!parsed.proposedSchedules;
}

/**
 * The Store module provides methods to save, retrieve and manipulate store.
 * It gathers all children modules and store their references in a single store class, which is provided as a Mixin
 */
@Component
class Store extends Vue {
    filter = filter;
    display = display;
    status = status;
    modal = modal;
    schedule = schedule;
    semester = semester;
    palette = palette;
    noti = noti;
    profile = profile;

    /**
     * save all store modules to localStorage
     */
    saveStatus() {
        saveStatus(this.profile.current);
    }

    /**
     * recover all store modules' states from the localStorage, given the target.
     *  - If target is a string, it will be treated as a profile name
     *  - If target is a `SemesterJSON`, the first profile corresponding to that semester will be loaded.
     * @param target
     */
    async loadProfile(target: string | SemesterJSON) {
        if (!this.semester.semesters.length) {
            this.noti.error('No semester data! Please refresh this page');
            return;
        }

        window.scheduleEvaluator.clear();

        let parsed: Partial<AncientStorage> | Partial<LegacyStorage> | Partial<SemesterState> = {};
        if (typeof target === 'string') {
            const data = localStorage.getItem(target);
            if (data) {
                try {
                    parsed = JSON.parse(data);
                } catch (e) {
                    console.error(e);
                }
            }
            await this.semester.selectSemester(
                parsed.currentSemester || this.semester.semesters[0]
            );
        } else {
            const { profiles } = this.profile;
            for (const profileName of profiles) {
                const data = localStorage.getItem(profileName);
                if (data) {
                    const temp = JSON.parse(data);
                    const { currentSemester } = parsed;
                    if (currentSemester && currentSemester.id === target.id) {
                        parsed = temp;
                        break;
                    }
                }
            }
            if (!parsed.currentSemester) {
                // todo: name clashing
                profiles.push(target.name);
            }
            this.profile.current = target.name;
            await this.semester.selectSemester(target);
        }

        if (isAncient(parsed)) {
            const ancient: AncientStorage = parsed || {};
            const oldStore: Partial<LegacyStorage> & AncientStorage = ancient;
            oldStore.proposedScheduleIndex = 0;
            oldStore.proposedSchedules = [oldStore.proposedSchedule];
            this.display.fromJSON(oldStore);
            this.filter.fromJSON(oldStore);
            this.schedule.fromJSON(oldStore);
            this.palette.fromJSON(oldStore.currentSchedule || { savedColors: {} });
        } else if (isLegacy(parsed)) {
            this.display.fromJSON(parsed.display || {});
            this.filter.fromJSON(parsed);
            this.schedule.fromJSON(parsed);
            this.palette.fromJSON(parsed.currentSchedule || { savedColors: {} });
        } else {
            const newStore = parsed as SemesterStorage;
            this.display.fromJSON(newStore.display || {});
            this.filter.fromJSON(newStore.filter || {});
            this.schedule.fromJSON(newStore.schedule || {});
            this.palette.fromJSON(newStore.palette || {});
        }
        if (this.schedule.generated) this.generateSchedules();
        else this.schedule.switchSchedule(false);
    }

    /**
     * @returns true if the current combination of sort options is valid, false otherwise
     *
     * notifications will be given for invalid combination via [[noti]]
     */
    validateSortOptions() {
        if (!Object.values(this.filter.sortOptions.sortBy).some(x => x.enabled)) {
            this.noti.error('You must have at least one sort option!');
            return false;
        } else if (
            Object.values(this.filter.sortOptions.sortBy).some(
                x => x.name === 'distance' && x.enabled
            ) &&
            (!window.buildingList || !window.timeMatrix)
        ) {
            this.noti.error('Building list fails to load. Please disable "walking distance"');
            return false;
        }
        return true;
    }

    getGeneratorOptions(): GeneratorOptions | void {
        const filteredStatus: CourseStatus[] = [];
        if (!this.filter.allowWaitlist) filteredStatus.push('Wait List');
        if (!this.filter.allowClosed) filteredStatus.push('Closed');

        const msg = this.filter.computeFilter();
        const timeSlots = msg.payload;
        if (!timeSlots) return this.noti.notify(msg);

        if (!this.validateSortOptions()) return;

        return {
            timeSlots,
            status: filteredStatus,
            sortOptions: this.filter.sortOptions,
            combineSections: this.display.combineSections,
            maxNumSchedules: this.display.maxNumSchedules
        };
    }

    generateSchedules() {
        this.status.foldView();

        if (this.schedule.proposedSchedule.empty())
            return this.noti.warn(`There are no classes in your schedule!`);

        const options = this.getGeneratorOptions();
        if (!options) return;

        const generator = new ScheduleGenerator(window.catalog, window.buildingList, options);
        const msg = generator.getSchedules(this.schedule.proposedSchedule);
        this.noti.notify(msg);
        const evaluator = msg.payload;
        if (evaluator) {
            window.scheduleEvaluator = evaluator;
            const num = evaluator.size();
            this.noti.success(`${num} Schedules Generated!`, 3);
            this.schedule.numGenerated = num;
            this.schedule.cpIndex = this.schedule.proposedScheduleIndex;
            this.schedule.switchSchedule(true);
        } else {
            window.scheduleEvaluator.clear();
            this.schedule.switchSchedule(false);
            this.schedule.cpIndex = -1;
            this.schedule.numGenerated = 0;
        }
    }

    /**
     * Select a semester and fetch all its associated data,
     * assign a correct Catalog object to `window.catalog`,
     * parse schedules and settings from `localStorage` and re-initialize global states
     *
     * @param currentSemester the semester to switch to
     * @param force whether to force-update semester data
     */
    async selectSemester(currentSemester?: SemesterJSON, force = false) {
        if (!this.semester.semesters.length) {
            this.noti.error('No semester data! Please refresh this page');
            return;
        }

        if (!currentSemester) currentSemester = this.semester.semesters[0];
        if (force) this.noti.info(`Updating ${currentSemester.name} data...`);

        this.status.loading = true;
        window.scheduleEvaluator.clear();

        const result = await this.semester.selectSemester(currentSemester, force);
        this.noti.notify(result);
        if (result.payload) this.loadProfile(currentSemester);

        this.status.loading = false;
    }

    // -------- watchers for store states that have side-effects
    @Watch('status.loading')
    @delay(10)
    loadingWatch() {
        if (this.status.loading) {
            if (this.noti.empty()) {
                this.noti.info('Loading...');
            }
        } else {
            if (this.noti.msg === 'Loading...') {
                this.noti.clear();
            }
        }
    }

    @Watch('display.multiSelect')
    @delay(10)
    private multiSelectWatch() {
        Schedule.options.multiSelect = this.display.multiSelect;
        this.schedule.currentSchedule.computeSchedule();
    }

    @Watch('display.combineSections')
    @delay(10)
    private combineSectionsWatch() {
        Schedule.options.combineSections = this.display.combineSections;
        this.schedule.currentSchedule.computeSchedule();
    }

    @Watch('palette.savedColors', { deep: true })
    @delay(10)
    private wat() {
        Schedule.savedColors = this.palette.savedColors;
        this.schedule.currentSchedule.computeSchedule();
    }

    @Watch('profile.current')
    @delay(200)
    private curProfWatch(oldVal: string, newVal: string) {
        localStorage.setItem('currentProfile', this.profile.current);
        this.loadProfile(this.profile.current);
    }

    @Watch('profile.profiles', { deep: true })
    private profsWatch() {
        localStorage.setItem('profiles', JSON.stringify(this.profile.profiles));
    }

    // --------- watchers for states that need to be automatically saved ---------
    // cannot watch schedules: it has circular dependencies
    // @Watch('schedule', { deep: true })
    // @delay(10)
    // private w1() {
    //     this.saveStatus();
    // }

    @Watch('display', { deep: true })
    @delay(10)
    private w2() {
        this.saveStatus();
    }

    @Watch('filter', { deep: true })
    @delay(10)
    private w3() {
        this.saveStatus();
    }

    @Watch('palette', { deep: true })
    @delay(10)
    private w4() {
        this.saveStatus();
    }
}
export default Store;
