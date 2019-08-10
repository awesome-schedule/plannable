/**
 * @module components/tabs
 */
import { DAYS } from '@/models/Meta';
import Store from '@/store';
import { Component } from 'vue-property-decorator';
import draggable from 'vuedraggable';

/**
 * the component for editing and applying filters
 * @author Hanzhi Zhou, Kaiying Shan
 */
@Component({
    components: {
        draggable
    }
})
export default class FilterView extends Store {

    get days() {
        return DAYS;
    }

    get enableSimilarity() {
        return window.scheduleEvaluator.refSchedule && Object.keys(window.scheduleEvaluator.refSchedule).length > 0;
    }

    dragEnd() {
        if (this.filter.sortOptions.mode === 0) this.changeSorting(undefined);
    }

    /**
     * negate the boolean value at `this.timeSlots[i][j]`
     * @param i the index of the time filter
     * @param j the index of the day (0 ~ 4)
     */
    updateFilterDay(i: number, j: number) {
        this.$set(this.filter.timeSlots[i], j, !this.filter.timeSlots[i][j]);
    }

    addTimeSlot() {
        this.filter.timeSlots.push([false, false, false, false, false, false, false, '', '']);
    }
    removeTimeSlot(n: number) {
        this.filter.timeSlots.splice(n, 1);
    }

    /**
     * get called when the sort mode changed or sort option at `optIdx` changed.
     * call [[ScheduleEvaluator.changeSort]]
     *
     * if a sort option changed, also disable options that are mutually exclusive to that one.
     *
     * if the sort mode changed, do nothing
     *
     * @param optIdx c
     */
    changeSorting(optIdx?: number) {
        if (!this.validateSortOptions()) return;
        if (optIdx !== undefined) {
            const option = this.filter.sortOptions.sortBy[optIdx];

            if (option.enabled) {
                for (const key of option.exclusive) {
                    for (const opt of this.filter.sortOptions.sortBy) {
                        if (opt.name === key) opt.enabled = false;
                    }
                }
            }
        }
        if (!window.scheduleEvaluator.empty()) {
            window.scheduleEvaluator.sort({ newOptions: this.filter.sortOptions });
            if (!this.schedule.generated) {
                this.schedule.switchSchedule(true);
            } else {
                // re-assign the current schedule
                this.schedule.currentSchedule = window.scheduleEvaluator.getSchedule(
                    this.schedule.currentScheduleIndex
                );
            }
        }
    }
}
