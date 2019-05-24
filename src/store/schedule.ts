/**
 * the schedule module provides methods to manipulate schedules
 * @author Hanzhi Zhou
 */

/**
 *
 */
import Schedule, { ScheduleJSON } from '../models/Schedule';
import { toJSON, StoreModule, saveStatus } from '.';

interface ScheduleStateBase {
    [x: string]: any;
    currentScheduleIndex: number;
    proposedScheduleIndex: number;
    cpIndex: number;
    generated: boolean;
}

export interface ScheduleState extends ScheduleStateBase {
    currentSchedule: Schedule;
    proposedSchedules: Schedule[];
}

export interface ScheduleStateJSON extends ScheduleStateBase {
    currentSchedule: ScheduleJSON;
    proposedSchedules: ScheduleJSON[];
}

class ScheduleStore implements StoreModule<ScheduleState, ScheduleStateJSON> {
    /**
     * total number of generated schedules, has the same value as
     * `window.scheduleEvaluator.size()`
     */
    numGenerated = 0;
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
     * The index of the proposed schedule corresponding to the generated schedules contained in
     * `window.scheduleEvaluator`
     */
    cpIndex = -1;
    /**
     * indicates whether the currently showing schedule is the generated schedule
     */
    generated = false;
    /**
     * the proposed schedule that is currently active
     */
    get proposedSchedule() {
        return this.proposedSchedules[this.proposedScheduleIndex];
    }
    /**
     * switch to next or previous proposed schedule. has bound checking.
     */
    switchProposed(index: number) {
        if (index < this.proposedSchedules.length && index >= 0) {
            this.proposedScheduleIndex = index;
            this.switchSchedule(false);
            saveStatus();
        }
    }
    /**
     * create a new empty schedule at the end of the proposedSchedules array and immediate switch to it
     */
    newProposed() {
        this.proposedSchedules.push(new Schedule());
        this.switchProposed(this.proposedSchedules.length - 1);
        saveStatus();
    }
    /**
     * copy the current schedule and append to the `proposedSchedules` array.
     * Immediately switch to the newly copied schedule.
     */
    copyCurrent() {
        const len = this.proposedSchedules.length;
        this.proposedSchedules.push(this.proposedSchedule.copy());
        this.switchProposed(len);
        saveStatus();
    }
    /**
     * delete the current proposed schedule, switch to the schedule after the deleted schedule.
     * do nothing if this is the last proposed schedule
     */
    deleteProposed() {
        if (this.proposedSchedules.length === 1) return;
        const idx = this.proposedScheduleIndex;

        if (!confirm(`Are you sure to delete schedule ${idx + 1}?`)) return;

        // if the schedule to be deleted corresponds to generated schedules,
        // this deletion invalidates the generated schedules immediately.
        if (idx === this.cpIndex) {
            window.scheduleEvaluator.clear();
            this.numGenerated = 0;
            this.cpIndex = -1;
        }
        this.proposedSchedules.splice(idx, 1);
        if (idx >= this.proposedSchedules.length) {
            this.switchProposed(idx - 1);
        } else {
            this.switchProposed(idx);
        }
        saveStatus();
    }
    /**
     * @param generated
     * if **true**, try to switch to generated schedules if none of the following conditions are met,
     * - there are no generated schedules
     * - or the generated schedules do not correspond to the current schedule
     *
     * switch to current proposed schedule if **false**
     */
    switchSchedule(generated: boolean) {
        if (generated) {
            if (this.cpIndex === this.proposedScheduleIndex && this.numGenerated) {
                this.generated = true;
                this.switchPage(this.currentScheduleIndex === null ? 0 : this.currentScheduleIndex);
            }
        } else {
            this.generated = false;
            this.currentSchedule = this.proposedSchedule;
        }
        saveStatus();
    }

    /**
     * Switch to `idx` page
     * assign `currentSchedule` with the generated schedule at index `idx`
     * @param idx
     */
    switchPage(idx: number) {
        if (idx < 0) {
            this.currentScheduleIndex = 0;
        } else if (idx >= window.scheduleEvaluator.size()) {
            this.currentScheduleIndex = window.scheduleEvaluator.size() - 1;
        } else {
            this.currentScheduleIndex = idx;
        }
        this.currentSchedule = window.scheduleEvaluator.getSchedule(this.currentScheduleIndex);
        saveStatus();
    }

    /**
     * clear the currently active schedules and generated schedules
     */
    clear() {
        this.currentSchedule.clean();
        this.proposedSchedule.clean();
        this.generated = false;
        if (this.cpIndex === this.proposedScheduleIndex) {
            this.cpIndex = -1;
            window.scheduleEvaluator.clear();
            this.numGenerated = 0;
        }
        saveStatus();
    }

    /**
     * clear the localStorage and reload the page
     */
    clearCache() {
        if (confirm('Your selected classes and schedules will be cleaned. Are you sure?')) {
            window.localStorage.clear();
            window.location.reload(true);
        }
    }

    fromJSON(obj: Partial<ScheduleStateJSON>) {
        const defaultState = this.getDefault();

        const proposed = obj.proposedSchedules;
        if (proposed instanceof Array) {
            this.proposedSchedules = proposed.map(x => {
                const temp = Schedule.fromJSON(x);
                if (temp) return temp;
                else return new Schedule();
            });
        } else {
            this.proposedSchedules = defaultState.proposedSchedules;
        }

        this.currentScheduleIndex =
            typeof obj.currentScheduleIndex === 'number'
                ? obj.currentScheduleIndex
                : defaultState.currentScheduleIndex;

        this.proposedScheduleIndex =
            typeof obj.proposedScheduleIndex === 'number'
                ? obj.proposedScheduleIndex
                : defaultState.proposedScheduleIndex;

        this.cpIndex = typeof obj.cpIndex === 'number' ? obj.cpIndex : defaultState.cpIndex;
        this.generated =
            typeof obj.generated === 'boolean' ? obj.generated : defaultState.generated;
    }

    toJSON(): ScheduleStateJSON {
        return toJSON<ScheduleState, ScheduleStateJSON>(this);
    }

    getDefault(): ScheduleState {
        return {
            currentScheduleIndex: 0,
            currentSchedule: new Schedule(),
            proposedSchedules: [new Schedule()],
            proposedScheduleIndex: 0,
            cpIndex: -1,
            generated: false
        };
    }
}

export const schedule = new ScheduleStore();
export default schedule;
