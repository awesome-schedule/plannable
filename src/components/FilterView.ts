/**
 *
 */
import { Component, Mixins } from 'vue-property-decorator';
import draggable from 'vuedraggable';
import Meta from '../models/Meta';
import Store from '../store';

@Component({
    components: {
        draggable
    }
})
export default class FilterView extends Mixins(Store) {
    get days() {
        return Meta.days;
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
        this.filter.timeSlots.push([false, false, false, false, false, '', '']);
    }
    removeTimeSlot(n: number) {
        this.filter.timeSlots.splice(n, 1);
    }

    changeSorting(optIdx?: number) {
        if (!this.validateSortOptions()) return;
        if (optIdx !== undefined) {
            const option = this.filter.sortOptions.sortBy[optIdx];

            if (option.enabled) {
                // disable options that are mutually exclusive to this one
                for (const key of option.exclusive) {
                    for (const opt of this.filter.sortOptions.sortBy) {
                        if (opt.name === key) opt.enabled = false;
                    }
                }
            }
        }
        if (!window.scheduleEvaluator.empty()) {
            window.scheduleEvaluator.changeSort(this.filter.sortOptions, true);
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
