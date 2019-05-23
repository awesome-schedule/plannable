import display, { DisplayState } from './display';
import filter, { FilterState } from './filter';
import schedule, { ScheduleStateJSON, ScheduleState } from './schedule';
import semester from './semester';
import { SemesterJSON } from '../models/Catalog';
import { SortOptions } from '../algorithm/ScheduleEvaluator';
import { ScheduleJSON } from '../models/Schedule';
import noti from './notification';
import ScheduleGenerator from '@/algorithm/ScheduleGenerator';

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
        generateSchedules();
    }
}

export const generateSchedules = _generateSchedules.bind(schedule);
function _generateSchedules(this: ScheduleState) {
    if (this.generated) this.currentSchedule = this.proposedSchedule;
    this.generated = false;

    if (this.currentSchedule.empty()) return noti.warn(`There are no classes in your schedule!`);

    const status = [];
    if (!filter.allowWaitlist) status.push('Wait List');
    if (!filter.allowClosed) status.push('Closed');

    const timeSlots = filter.computeFilter();

    // null means there's an error processing time filters. Don't continue if that's the case
    if (timeSlots === null) {
        noti.error(`Invalid time filter`);
        return;
    }

    if (!filter.validateSortOptions()) return;

    // this.loading = true;
    const generator = new ScheduleGenerator(window.catalog, window.buildingList);
    try {
        const evaluator = generator.getSchedules(this.currentSchedule, {
            events: this.currentSchedule.events,
            timeSlots,
            status,
            sortOptions: filter.sortOptions,
            combineSections: display.combineSections,
            maxNumSchedules: display.maxNumSchedules
        });
        window.scheduleEvaluator.clear();
        window.scheduleEvaluator = evaluator;
        noti.success(`${window.scheduleEvaluator.size()} Schedules Generated!`, 3);
        this.cpIndex = this.proposedScheduleIndex;
        this.switchSchedule(true);
    } catch (err) {
        console.warn(err);
        this.generated = false;
        window.scheduleEvaluator.clear();
        noti.error(err.message);
        this.cpIndex = -1;
    }
    saveStatus();
}
