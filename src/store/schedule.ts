/**
 * the schedule module provides methods to manipulate currently showing schedules
 * @author Hanzhi Zhou
 */

/**
 *
 */
import { Vue, Component } from 'vue-property-decorator';
import Schedule, { ScheduleJSON } from '../models/Schedule';
import { toJSON, saveStatus, StoreModule } from './helper';

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

@Component
class ScheduleStore extends Vue implements StoreModule<ScheduleState, ScheduleStateJSON> {
    [x: string]: any;
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
     * The index of the proposed schedule corresponding to the generated schedule
     */
    cpIndex = -1;
    /**
     * indicates whether the currently showing schedule is the generated schedule
     */
    generated = false;

    set proposedSchedule(sche: Schedule) {
        // need Vue's reactivity
        this.$set(this.proposedSchedules, this.proposedScheduleIndex, sche);
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
        }
        saveStatus();
    }
    newProposed() {
        this.proposedSchedules.push(new Schedule());
        this.switchProposed(this.proposedSchedules.length - 1);
    }
    /**
     * copy the current schedule and append to the proposedSchedule array.
     * Immediately switch to the last proposed schedule.
     */
    copyCurrent() {
        const len = this.proposedSchedules.length;
        this.proposedSchedules.push(this.proposedSchedule.copy());
        this.switchProposed(len);
    }
    deleteProposed() {
        if (this.proposedSchedules.length === 1) return;
        const idx = this.proposedScheduleIndex;

        if (!confirm(`Are you sure to delete schedule ${idx + 1}?`)) return;

        // if the schedule to be deleted corresponds to generated schedules,
        // this deletion invalidates the generated schedules immediately.
        if (idx === this.cpIndex) {
            window.scheduleEvaluator.clear();
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
    switchSchedule(generated: boolean) {
        if (generated) {
            // don't do anything if already in "generated" mode
            // or there are no generated schedules
            // or the generated schedules do not correspond to the current schedule
            if (
                !this.generated &&
                !window.scheduleEvaluator.empty() &&
                this.cpIndex === this.proposedScheduleIndex
            ) {
                this.generated = true;
                this.switchPage(this.currentScheduleIndex === null ? 0 : this.currentScheduleIndex);
            }
        } else {
            this.generated = false;
            this.currentSchedule = this.proposedSchedule;
        }
    }

    /**
     * Switch to `idx` page. If update is true, also update the pagination status.
     * @param idx
     * @param update  whether to update the pagination status
     */
    switchPage(idx: number) {
        if (0 <= idx && idx < window.scheduleEvaluator.size()) {
            this.currentScheduleIndex = idx;
            this.currentSchedule = window.scheduleEvaluator.getSchedule(idx);
            saveStatus();
        }
    }

    clear() {
        this.currentSchedule.clean();
        this.proposedSchedule.clean();
        this.generated = false;
        window.scheduleEvaluator.clear();
        this.cpIndex = -1;
        saveStatus();
    }

    clearCache() {
        if (confirm('Your selected classes and schedules will be cleaned. Are you sure?')) {
            this.clear();
            window.localStorage.clear();
            window.location.reload(true);
        }
    }

    fromJSON(obj: Partial<ScheduleStateJSON>) {
        const defaultState = this.getDefault();

        const current = Schedule.fromJSON(obj.currentSchedule);
        this.currentSchedule = current ? current : defaultState.currentSchedule;
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
