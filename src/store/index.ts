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
import Event from '../models/Event';
import { CourseStatus, DAYS } from '../models/Meta';
import Schedule, { ScheduleJSON } from '../models/Schedule';
import { to12hr } from '../utils';
import display, { DisplayState } from './display';
import filter, { FilterStateJSON } from './filter';
import modal from './modal';
import noti from './notification';
import palette, { PaletteState } from './palette';
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
export function saveStatus() {
    const { currentSemester } = semester;
    if (!currentSemester) return;

    const name = localStorage.getItem('currentProfile');
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

    /**
     * save all store modules to localStorage
     */
    saveStatus() {
        saveStatus();
    }

    /**
     * recover all store modules' states from the localStorage, given the semester id
     *
     * If no local data is present, default values will be assigned.
     *
     * @param profId
     */
    async loadProfile(profId: string | SemesterJSON) {
        if (!this.semester.semesters.length) {
            this.noti.error('No semester data! Please refresh this page');
            return;
        }

        let parsed: Partial<AncientStorage> | Partial<LegacyStorage> | Partial<SemesterState> = {};
        if (typeof profId === 'string') {
            const data = localStorage.getItem(profId);
            if (data) {
                try {
                    parsed = JSON.parse(data);
                } catch (e) {
                    console.error(e);
                }
            }
        } else {
            const rawProfs = localStorage.getItem('profiles');
            if (rawProfs) {
                const profiles = JSON.parse(rawProfs);
                if (profiles instanceof Array) {
                    for (const profileName of profiles) {
                        const data = localStorage.getItem(profileName);
                        if (data) {
                            parsed = JSON.parse(data);
                            const { currentSemester } = parsed;
                            if (currentSemester && currentSemester.id === profId.id) break;
                        }
                    }
                }
            }
        }

        window.scheduleEvaluator.clear();
        this.semester.selectSemester(parsed.currentSemester || this.semester.semesters[0]);

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

    /**
     * Preprocess the time filters and convert them to an array of event.
     * returns null on parsing error
     */
    computeFilter(): Event[] | void {
        const { timeSlots } = this.filter;
        const events: Event[] = [];

        // no time slots => no time filter
        if (!timeSlots.length) return events;
        for (const time of timeSlots) {
            let days = '';
            for (let j = 0; j < 5; j++) {
                if (time[j]) days += DAYS[j];
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
                return this.noti.error('Invalid time input.');
            }
            days += ' ' + to12hr(time[5]) + ' - ' + to12hr(time[6]);
            events.push(new Event(days, false));
        }

        if (!events.length) return this.noti.error('You need to select at least one day!');
        return events;
    }

    getGeneratorOptions(): GeneratorOptions | undefined {
        const filteredStatus: CourseStatus[] = [];
        if (!this.filter.allowWaitlist) filteredStatus.push('Wait List');
        if (!this.filter.allowClosed) filteredStatus.push('Closed');

        const timeSlots = this.computeFilter();

        // falsy value implies that
        // there's an error processing time filters. Don't continue if that's the case
        if (!timeSlots) {
            this.noti.error(`Invalid time filter`);
            return;
        }

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
