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

/**
 * save all store modules to lcoalStorage
 */
export function saveStatus() {
    const { currentSemester } = semester;
    if (!currentSemester) return;
    const obj: SemesterStorage = {
        currentSemester,
        display,
        filter,
        schedule: schedule.toJSON(),
        palette
    };
    localStorage.setItem(currentSemester.id, JSON.stringify(obj));
}

/**
 * recover all store modules' states from the localStorage, given the semester
 * @param semesterId
 */
export function parseStatus(semesterId: string) {
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
        display.fromJSON(oldStore);
        filter.fromJSON(oldStore);
        schedule.fromJSON(oldStore);
        palette.fromJSON(oldStore.currentSchedule || { savedColors: {} });
    } else if (parsed.currentSchedule && parsed.proposedSchedules) {
        const oldStore: LegacyStorage = parsed;
        display.fromJSON(oldStore.display || {});
        filter.fromJSON(oldStore);
        schedule.fromJSON(oldStore);
        palette.fromJSON(oldStore.currentSchedule || { savedColors: {} });
    } else {
        const newStore: SemesterStorage = parsed;
        display.fromJSON(newStore.display || {});
        filter.fromJSON(newStore.filter || {});
        schedule.fromJSON(newStore.schedule || {});
        palette.fromJSON(newStore.palette || {});
    }

    schedule.currentSchedule.computeSchedule();

    if (schedule.generated) {
        generateSchedules();
    }
}

export function getGeneratorOptions() {
    const status: string[] = [];
    if (!filter.allowWaitlist) status.push('Wait List');
    if (!filter.allowClosed) status.push('Closed');

    const timeSlots = filter.computeFilter();

    // null means there's an error processing time filters. Don't continue if that's the case
    if (!timeSlots) {
        noti.error(`Invalid time filter`);
        return;
    }

    if (!filter.validateSortOptions()) return;

    return {
        timeSlots,
        status,
        sortOptions: filter.sortOptions,
        combineSections: display.combineSections,
        maxNumSchedules: display.maxNumSchedules
    };
}

export function generateSchedules() {
    if (schedule.generated) schedule.currentSchedule = schedule.proposedSchedule;
    schedule.generated = false;

    if (schedule.currentSchedule.empty())
        return noti.warn(`There are no classes in your schedule!`);

    const options = getGeneratorOptions();
    if (!options) return;

    const generator = new ScheduleGenerator(window.catalog, window.buildingList, options);
    try {
        const evaluator = generator.getSchedules(schedule.currentSchedule);
        window.scheduleEvaluator = evaluator;
        const num = window.scheduleEvaluator.size();
        noti.success(`${num} Schedules Generated!`, 3);
        schedule.numGenerated = num;
        schedule.cpIndex = schedule.proposedScheduleIndex;
        schedule.switchSchedule(true);
    } catch (err) {
        console.warn(err);
        schedule.generated = false;
        window.scheduleEvaluator.clear();
        noti.error(err.message);
        schedule.cpIndex = -1;
        schedule.numGenerated = 0;
    }
    saveStatus();
}
