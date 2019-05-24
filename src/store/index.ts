export { filter } from './filter';
export { display } from './display';
export { noti } from './notification';
export { modal } from './modal';
export { semester } from './semester';
export { schedule } from './schedule';
export { status } from './status';
export { palette } from './palette';

import Vue from 'vue';
import Component from 'vue-class-component';
/**
 * the helper module provides methods to save/retrieve and manipulate store
 * @author Hanzhi Zhou
 */

/**
 *
 */
import ScheduleGenerator from '@/algorithm/ScheduleGenerator';
import { EvaluatorOptions } from '../algorithm/ScheduleEvaluator';
import { SemesterJSON } from '../models/Catalog';
import { ScheduleJSON } from '../models/Schedule';
import display, { DisplayState } from './display';
import filter, { FilterStateJSON } from './filter';
import noti from './notification';
import schedule, { ScheduleStateJSON } from './schedule';
import semester from './semester';
import palette, { PaletteState } from './palette';
import modal from './modal';
import status from './status';

import { createDecorator } from 'vue-class-component';
import { ComputedOptions } from 'vue';

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
            display: this.display,
            filter: this.filter,
            schedule: this.schedule.toJSON(),
            palette: this.palette
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

        if (this.schedule.generated) {
            this.generateSchedules();
        }
    }

    getGeneratorOptions() {
        const filteredStatus: string[] = [];
        if (!this.filter.allowWaitlist) filteredStatus.push('Wait List');
        if (!this.filter.allowClosed) filteredStatus.push('Closed');

        const timeSlots = this.filter.computeFilter();

        // null means there's an error processing time filters. Don't continue if that's the case
        if (!timeSlots) {
            this.noti.error(`Invalid time filter`);
            return;
        }

        if (!this.filter.validateSortOptions()) return;

        return {
            timeSlots,
            status: filteredStatus,
            sortOptions: this.filter.sortOptions,
            combineSections: this.display.combineSections,
            maxNumSchedules: this.display.maxNumSchedules
        };
    }

    generateSchedules() {
        if (this.schedule.generated) this.schedule.currentSchedule = this.schedule.proposedSchedule;
        this.schedule.generated = false;

        if (this.schedule.currentSchedule.empty())
            return this.noti.warn(`There are no classes in your schedule!`);

        const options = this.getGeneratorOptions();
        if (!options) return;

        const generator = new ScheduleGenerator(window.catalog, window.buildingList, options);
        try {
            const evaluator = generator.getSchedules(schedule.currentSchedule);
            window.scheduleEvaluator = evaluator;
            const num = window.scheduleEvaluator.size();
            this.noti.success(`${num} Schedules Generated!`, 3);
            this.schedule.numGenerated = num;
            this.schedule.cpIndex = schedule.proposedScheduleIndex;
            this.schedule.switchSchedule(true);
        } catch (err) {
            console.warn(err);
            this.schedule.generated = false;
            window.scheduleEvaluator.clear();
            this.noti.error(err.message);
            this.schedule.cpIndex = -1;
            this.schedule.numGenerated = 0;
        }
        this.saveStatus();
    }

    async selectSemester(currentSemester: SemesterJSON, force: boolean = false) {
        this.status.loading = true;
        const result = await this.semester.selectSemester(currentSemester, force);
        if (result) {
            this.parseStatus(currentSemester.id);
        }
        this.status.loading = false;
    }
}
