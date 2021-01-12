/**
 * @module src/components/tabs
 */

/**
 *
 */
import { DAYS } from '@/models/Schedule';
import Store from '@/store';
import { Component } from 'vue-property-decorator';
import draggable from 'vuedraggable';
import { SortFunctions } from '@/algorithm/ScheduleEvaluator';

/**
 * the component for editing and applying filters
 * @author Hanzhi Zhou, Kaiying Shan
 * @noInheritDoc
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

    dragEnd() {
        if (this.filter.sortOptions.mode === 0) this.changeSorting();
    }

    /**
     * negate the boolean value at `this.timeSlots[i][j]`
     * @param i the index of the time filter
     * @param j the index of the day (0 to 7)
     */
    updateFilterDay(i: number, j: number) {
        this.$set(this.filter.timeSlots[i], j, !this.filter.timeSlots[i][j]);
    }

    getSortOptRange(name: keyof SortFunctions) {
        const cache = window.scheduleEvaluator.sortCoeffCache[name];
        return cache ? cache[1] - cache[2] : -1; // max - min
    }

    /**
     * get called when the sort mode changed or sort option at `optIdx` changed.
     * call [[ScheduleEvaluator.sort]]. Moreover,
     * - if a sort option changed, also disable options that are mutually exclusive to that one.
     * - if the sort mode changed, do nothing
     * @param optIdx
     */
    changeSorting(optIdx?: number) {
        if (!this.validateSortOptions()) return;
        if (optIdx !== undefined) {
            const option = this.filter.sortOptions.sortBy[optIdx];

            if (option.enabled) {
                for (const key of option.exclusive) {
                    for (const opt of this.filter.sortOptions.sortBy) {
                        if (opt.name === key) {
                            opt.enabled = false; // option names are unique
                            break;
                        }
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
