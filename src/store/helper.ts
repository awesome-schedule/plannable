import display, { DisplayState } from './display';
import filter, { FilterState } from './filter';
import schedule, { ScheduleStateJSON } from './schedule';
import semester from './semester';
import { SemesterJSON } from '@/models/Catalog';

export interface SemesterStorage {
    currentSemester: SemesterJSON;
    display: DisplayState;
    filter: FilterState;
    schedule: ScheduleStateJSON;
}

export function toJSON<State extends object>(thisArg: State, defaultObj: State): State {
    const result = {} as State;
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
    let parsed: Partial<SemesterStorage> = {};
    if (data) {
        try {
            parsed = JSON.parse(data);
        } catch (e) {}
    }
    display.fromJSON(parsed.display || {});
    filter.fromJSON(parsed.filter || {});
    schedule.fromJSON(parsed.schedule || {});

    if (schedule.generated) {
        schedule.generateSchedules();
    }
}
