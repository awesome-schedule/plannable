import ScheduleGenerator from '@/algorithm/ScheduleGenerator';
import { EvaluatorOptions } from '../algorithm/ScheduleEvaluator';
import { SemesterJSON } from '../models/Catalog';
import { ScheduleJSON } from '../models/Schedule';
import display, { DisplayState } from './display';
import filter, { FilterState } from './filter';
import noti from './notification';
import schedule, { ScheduleStateJSON } from './schedule';
import semester from './semester';

export interface SemesterStorage {
    currentSemester: SemesterJSON;
    display: DisplayState;
    filter: FilterState;
    schedule: ScheduleStateJSON;
}

export interface LegacyStorage {
    currentSemester: SemesterJSON;
    currentScheduleIndex: number;
    proposedScheduleIndex: number;
    cpIndex: number;
    currentSchedule: ScheduleJSON;
    proposedSchedules: ScheduleJSON[];

    display: DisplayState;

    timeSlots: [boolean, boolean, boolean, boolean, boolean, string, string][];
    allowWaitlist: boolean;
    allowClosed: boolean;
    sortOptions: EvaluatorOptions;
}

interface StorageItem<State> {
    getDefault(): State;
}

export function toJSON<State extends object>(thisArg: State & StorageItem<State>): State {
    const result = {} as State;
    const defaultObj = thisArg.getDefault();
    for (const key in defaultObj) {
        result[key] = thisArg[key];
    }
    return result;
}

export function saveStatus() {
    const { currentSemester } = semester;
    if (!currentSemester) return;
    localStorage.setItem(
        currentSemester.id,
        JSON.stringify({
            currentSemester,
            display,
            filter,
            schedule
        })
    );
}

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
    if (parsed.currentSchedule && parsed.proposedSchedules) {
        const old: LegacyStorage = parsed;
        display.fromJSON(old.display || {});
        filter.fromJSON(old);
        schedule.fromJSON(old);
    } else {
        const newStore: SemesterStorage = parsed;
        display.fromJSON(newStore.display || {});
        filter.fromJSON(newStore.filter || {});
        schedule.fromJSON(newStore.schedule || {});
    }

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

// export const generateSchedules = _generateSchedules.bind(schedule);
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
        window.scheduleEvaluator.clear();
        window.scheduleEvaluator = evaluator;
        noti.success(`${window.scheduleEvaluator.size()} Schedules Generated!`, 3);
        schedule.cpIndex = schedule.proposedScheduleIndex;
        schedule.switchSchedule(true);
    } catch (err) {
        console.warn(err);
        schedule.generated = false;
        window.scheduleEvaluator.clear();
        noti.error(err.message);
        schedule.cpIndex = -1;
    }
    saveStatus();
}
