import display, { DisplayState } from './display';
import filter, { FilterState } from './filter';
import schedule, { ScheduleStateJSON } from './schedule';
import semester from './semester';
import { SemesterJSON } from '../models/Catalog';
import { SortOptions } from '../algorithm/ScheduleEvaluator';
import { ScheduleJSON } from '../models/Schedule';

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
    sortOptions: SortOptions;
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
        schedule.generateSchedules();
    }
}
