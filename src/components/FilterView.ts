/**
 *
 */
import { Component, Vue } from 'vue-property-decorator';
import draggable from 'vuedraggable';
import Meta from '../models/Meta';
import Store from '../store';

@Component({
    components: {
        draggable
    }
})
export default class FilterView extends Store {
    get days() {
        return Meta.days;
    }
    dragEnd() {
        if (this.filter.sortOptions.mode === 0) this.changeSorting(undefined);
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
