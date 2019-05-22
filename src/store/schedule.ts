/**
 *
 */
import { Vue, Component } from 'vue-property-decorator';
import Schedule, { ScheduleJSON } from '../models/Schedule';
import noti from './notification';
import filter from '../store/filter';
import display from './display';
import ScheduleGenerator from '@/algorithm/ScheduleGenerator';

@Component
export class ScheduleStore extends Vue {
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

    /**
     * get the list of current ids, sorted in alphabetical order of the keys
     */
    get currentIds(): Array<[string, string]> {
        return Object.entries(this.currentSchedule.currentIds).sort((a, b) =>
            a[0] === b[0] ? 0 : a[0] < b[0] ? -1 : 1
        );
    }
    set proposedSchedule(schedule: Schedule) {
        // need Vue's reactivity
        this.$set(this.proposedSchedules, this.proposedScheduleIndex, schedule);
    }
    /**
     * the proposed schedule that is currently active
     */
    get proposedSchedule() {
        return this.proposedSchedules[this.proposedScheduleIndex];
    }

    /**
     * whether there're schedules generated. Because script between <template>
     * tag cannot access global objects, we need a method
     */
    generatedEmpty() {
        return window.scheduleEvaluator.empty();
    }
    /**
     * switch to next or previous proposed schedule. has bound checking.
     */
    switchProposed(index: number) {
        if (index < this.proposedSchedules.length && index >= 0) {
            this.proposedScheduleIndex = index;
            this.switchSchedule(false);
        }
        // this.saveStatus();
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
        // this.saveStatus();
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
                this.switchPage(
                    this.currentScheduleIndex === null ? 0 : this.currentScheduleIndex,
                    true
                );
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
    switchPage(idx: number, update = false) {
        if (0 <= idx && idx < window.scheduleEvaluator.size()) {
            this.currentScheduleIndex = idx;
            // if (update) {
            //     this.tempScheduleIndex = idx;
            // } else {
            //     this.tempScheduleIndex = null;
            // }
            this.currentSchedule = window.scheduleEvaluator.getSchedule(idx);
            // this.saveStatus();
        }
    }

    clear() {
        this.currentSchedule.clean();
        this.proposedSchedule.clean();
        this.generated = false;
        window.scheduleEvaluator.clear();
        this.cpIndex = -1;
        // this.saveStatus();
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
            // this.saveStatus();
            noti.success(`${window.scheduleEvaluator.size()} Schedules Generated!`, 3);
            this.cpIndex = this.proposedScheduleIndex;
            this.switchSchedule(true);
            // this.loading = false;
        } catch (err) {
            console.warn(err);
            this.generated = false;
            window.scheduleEvaluator.clear();
            noti.error(err.message);
            // this.saveStatus();
            this.cpIndex = -1;
            // this.loading = false;
        }
    }
}

export const schedule = new ScheduleStore();
export default schedule;
