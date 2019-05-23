/**
 *
 */
import { Vue, Component } from 'vue-property-decorator';
import Schedule, { ScheduleJSON } from '../models/Schedule';
import noti from './notification';
import filter from '../store/filter';
import display from './display';
import ScheduleGenerator from '@/algorithm/ScheduleGenerator';
import { toJSON, saveStatus } from './helper';

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
export class ScheduleStore extends Vue implements ScheduleState {
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
                this.proposedSchedule = this.currentSchedule;
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
            this.currentSchedule.clean();
            this.generated = false;
            window.scheduleEvaluator.clear();
            localStorage.clear();
            this.cpIndex = -1;
        }
    }

    generateSchedules() {
        if (this.generated) this.currentSchedule = this.proposedSchedule;
        this.generated = false;

        if (this.currentSchedule.empty())
            return noti.warn(`There are no classes in your schedule!`);

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
            return defaultState.proposedSchedules;
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

    toJSON() {
        return toJSON(this, this.getDefault());
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
