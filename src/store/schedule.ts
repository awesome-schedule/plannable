/**
 * @module store
 */

/**
 *
 */
import Schedule, { ScheduleJSON } from '../models/Schedule';
import { StoreModule, saveStatus } from '.';

interface ScheduleStateBase {
    /**
     * the index of the current schedule in the scheduleEvaluator.schedules array,
     * only applicable when generated=true
     */
    currentScheduleIndex: number;
    /**
     * the index of the active proposed
     */
    proposedScheduleIndex: number;
    /**
     * The index of the proposed schedule corresponding to the generated schedules contained in
     * `window.scheduleEvaluator`
     */
    cpIndex: number;
    /**
     * indicates whether the currently showing schedule is the generated schedule
     */
    generated: boolean;
    /**
     * the array of proposed schedules
     */
    proposedSchedules: any[];
}

export interface ScheduleState extends ScheduleStateBase {
    proposedSchedules: Schedule[];
    /**
     * currently rendered schedule
     */
    currentSchedule: Schedule;
    /**
     * total number of generated schedules, has the same value as
     * `window.scheduleEvaluator.size()`
     */
    numGenerated: number;
}

export interface ScheduleStateJSON extends ScheduleStateBase {
    proposedSchedules: ScheduleJSON[];
}

// tslint:disable-next-line: no-empty-interface
export interface ScheduleStore extends ScheduleState {}

/**
 * the schedule module provides methods to manipulate schedules
 * @author Hanzhi Zhou
 */
export class ScheduleStore implements StoreModule<ScheduleState, ScheduleStateJSON> {
    public static compressJSON(obj: ScheduleStateJSON) {
        return [
            obj.currentScheduleIndex,
            obj.proposedScheduleIndex,
            obj.cpIndex,
            +obj.generated,
            obj.proposedSchedules.map(s => Schedule.compressJSON(s))
        ] as const;
    }

    public static decompressJSON(
        obj: ReturnType<typeof ScheduleStore.compressJSON>
    ): ScheduleStateJSON {
        return {
            currentScheduleIndex: obj[0],
            proposedScheduleIndex: obj[1],
            cpIndex: obj[2],
            generated: Boolean(obj[3]),
            proposedSchedules: obj[4].map(s => Schedule.decompressJSON(s))
        };
    }

    constructor() {
        Object.assign(this, this.getDefault());
    }
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
     * create a new empty schedule at the end of the proposedSchedules array and immediately switch to it
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
                this.switchPage(this.currentScheduleIndex);
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
        if (this.numGenerated <= 0) return;
        if (idx < 0) {
            this.currentScheduleIndex = 0;
        } else if (idx >= this.numGenerated) {
            this.currentScheduleIndex = this.numGenerated - 1;
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
        this.proposedSchedule.clean();
        if (this.cpIndex === this.proposedScheduleIndex) {
            this.cpIndex = -1;
            window.scheduleEvaluator.clear();
            this.numGenerated = 0;
        }
        this.switchSchedule(false);
        saveStatus();
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

        this.numGenerated = 0;
        saveStatus();
    }

    toJSON() {
        // exclude numGenerated and currentSchedule
        const { numGenerated, currentSchedule, ...others } = this as ScheduleStore;
        return others as ScheduleStateJSON;
    }

    getDefault(): ScheduleState {
        const currentSchedule = new Schedule();
        return {
            currentScheduleIndex: 0,
            currentSchedule,
            proposedSchedules: [currentSchedule],
            proposedScheduleIndex: 0,
            cpIndex: -1,
            generated: false,
            numGenerated: 0
        };
    }
}

export const schedule = new ScheduleStore();
export default schedule;
