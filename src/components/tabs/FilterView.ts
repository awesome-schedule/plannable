/**
 * @module components/tabs
 */
import { Component } from 'vue-property-decorator';
import draggable from 'vuedraggable';
import { DAYS } from '@/models/Meta';
import Store from '@/store';

/**
 * the component for editing and applying filters
 * @author Hanzhi Zhou, Kaiying Shan, Zichao Hu
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
    isAllDayArray: boolean[] = [];

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
        this.isAllDayArray.push(false);
    }

    removeTimeSlot(n: number) {
        this.filter.timeSlots.splice(n, 1);
        this.isAllDayArray.splice(n, 1);
    }

    // disable the input groups and set default value
    toggleAllDay(
        value: [boolean, boolean, boolean, boolean, boolean, string, string],
        index: number
    ) {
        const currentBool = this.isAllDayArray[index];
        this.isAllDayArray.splice(index, 1, currentBool === false ? true : false);
        value[5] = '08:00';
        value[6] = '22:00';
        console.log(this.isAllDayArray);
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
