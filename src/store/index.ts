/**
 * the helper module provides methods to save/retrieve and manipulate store
 * @author Hanzhi Zhou
 */

/**
 *
 */
export * from './display';
export * from './filter';
export * from './modal';
export * from './notification';
export * from './palette';
export * from './schedule';
export * from './semester';
export * from './status';

import Meta from '@/models/Meta';
import { to12hr } from '@/utils';
import Vue, { ComputedOptions } from 'vue';
import { createDecorator } from 'vue-class-component';
import { Component, Watch } from 'vue-property-decorator';
import { EvaluatorOptions } from '../algorithm/ScheduleEvaluator';
import ScheduleGenerator from '../algorithm/ScheduleGenerator';
import { SemesterJSON } from '../models/Catalog';
import Event from '../models/Event';
import Schedule, { ScheduleJSON } from '../models/Schedule';
import display, { DisplayState } from './display';
import filter, { FilterStateJSON } from './filter';
import modal from './modal';
import noti from './notification';
import palette, { PaletteState } from './palette';
import schedule, { ScheduleStateJSON } from './schedule';
import semester from './semester';
import status from './status';

export const NoCache = createDecorator((options, key) => {
    (options.computed![key] as ComputedOptions<any>).cache = false;
});

export interface SemesterStorage {
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

/**
 * A Store Module must have
 * @typeparam State
 * @typeparam JSONState the JSON representation of its state
 */
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
     * @param obj an object that has all or some properties of the `JSONState`.
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
 * convert a store module to its JSON representation
 */
export function toJSON<State, JSONState>(thisArg: StoreModule<State, JSONState>): JSONState {
    const result = {} as JSONState;
    const defaultObj = thisArg.getDefault();
    for (const key in defaultObj) {
        (result as any)[key] = thisArg[key];
    }
    return result;
}

// You can declare a mixin as the same style as components.
@Component
export default class Store extends Vue {
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
        const { currentSemester } = this.semester;
        if (!currentSemester) return;
        const obj: SemesterStorage = {
            currentSemester,
            display: this.display.toJSON(),
            filter: this.filter.toJSON(),
            schedule: this.schedule.toJSON(),
            palette: this.palette.toJSON()
        };
        localStorage.setItem(currentSemester.id, JSON.stringify(obj));
    }

    /**
     * recover all store modules' states from the localStorage, given the semester
     * @param semesterId
     */
    parseStatus(semesterId: string) {
        const data = localStorage.getItem(semesterId);
        let parsed: any = {};
        if (data) {
            try {
                parsed = JSON.parse(data);
            } catch (e) {
                console.warn(e);
            }
        }
        if (parsed.currentSchedule && parsed.proposedSchedule) {
            const ancient: AncientStorage = parsed || {};
            const oldStore: Partial<LegacyStorage> & AncientStorage = ancient;
            oldStore.proposedScheduleIndex = 0;
            oldStore.proposedSchedules = [oldStore.proposedSchedule];
            this.display.fromJSON(oldStore);
            this.filter.fromJSON(oldStore);
            this.schedule.fromJSON(oldStore);
            this.palette.fromJSON(oldStore.currentSchedule || { savedColors: {} });
        } else if (parsed.currentSchedule && parsed.proposedSchedules) {
            const oldStore: LegacyStorage = parsed;
            this.display.fromJSON(oldStore.display || {});
            this.filter.fromJSON(oldStore);
            this.schedule.fromJSON(oldStore);
            this.palette.fromJSON(oldStore.currentSchedule || { savedColors: {} });
        } else {
            const newStore: SemesterStorage = parsed;
            this.display.fromJSON(newStore.display || {});
            this.filter.fromJSON(newStore.filter || {});
            this.schedule.fromJSON(newStore.schedule || {});
            this.palette.fromJSON(newStore.palette || {});
        }
        this.schedule.currentSchedule.computeSchedule();
        if (this.schedule.generated) this.generateSchedules();
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
    computeFilter(): Event[] | null {
        const timeSlotsRecord: Event[] = [];
        for (const time of this.filter.timeSlots) {
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
                this.noti.error('Invalid time input.');
                return null;
            }
            days += ' ' + to12hr(time[5]) + ' - ' + to12hr(time[6]);
            timeSlotsRecord.push(new Event(days, false));
        }
        return timeSlotsRecord;
    }

    getGeneratorOptions() {
        const filteredStatus: string[] = [];
        if (!this.filter.allowWaitlist) filteredStatus.push('Wait List');
        if (!this.filter.allowClosed) filteredStatus.push('Closed');

        const timeSlots = this.computeFilter();

        // null means there's an error processing time filters. Don't continue if that's the case
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
        if (this.schedule.proposedSchedule.empty())
            return this.noti.warn(`There are no classes in your schedule!`);

        const options = this.getGeneratorOptions();
        if (!options) return;

        const generator = new ScheduleGenerator(window.catalog, window.buildingList, options);
        try {
            const evaluator = generator.getSchedules(this.schedule.proposedSchedule);
            window.scheduleEvaluator = evaluator;
            const num = window.scheduleEvaluator.size();
            this.noti.success(`${num} Schedules Generated!`, 3);
            this.schedule.numGenerated = num;
            this.schedule.cpIndex = this.schedule.proposedScheduleIndex;
            this.schedule.switchSchedule(true);
        } catch (err) {
            console.warn(err);
            this.schedule.generated = false;
            window.scheduleEvaluator.clear();
            this.noti.error(err.message);
            this.schedule.cpIndex = -1;
            this.schedule.numGenerated = 0;
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
     * @param currentSemester the semester to switch to
     * @param force whether to force-update semester data
     */
    async selectSemester(currentSemester: SemesterJSON, force: boolean = false) {
        this.status.loading = true;
        const result = await this.semester.selectSemester(currentSemester, force);
        if (result) this.parseStatus(currentSemester.id);

        this.status.loading = false;
    }

    @Watch('status.loading')
    loadingWatch() {
        if (this.status.loading) {
            if (noti.empty()) {
                noti.info('Loading...');
            }
        } else {
            if (noti.msg === 'Loading...') {
                noti.clear();
            }
        }
    }

    // @Watch('display.multiSelect')
    // private multiSelectWatch() {
    //     Schedule.options.multiSelect = this.display.multiSelect;
    //     this.schedule.currentSchedule.computeSchedule();
    // }

    // @Watch('display.combineSections')
    // private combineSectionsWatch() {
    //     Schedule.options.combineSections = this.display.combineSections;
    //     this.schedule.currentSchedule.computeSchedule();
    // }

    // @Watch('palette.savedColors', { deep: true })
    // private wat() {
    //     Schedule.savedColors = this.palette.savedColors;
    //     this.schedule.currentSchedule.computeSchedule();
    // }

    // @Watch('schedule', { deep: true })
    // private w1() {
    //     this.saveStatus();
    // }

    // @Watch('display', { deep: true })
    // private w2() {
    //     this.saveStatus();
    // }

    // @Watch('filter', { deep: true })
    // private w3() {
    //     this.saveStatus();
    // }

    // @Watch('palette', { deep: true })
    // private w4() {
    //     this.saveStatus();
    // }

    // @Watch('semester', { deep: true })
    // private w5() {
    //     this.saveStatus();
    // }
}
