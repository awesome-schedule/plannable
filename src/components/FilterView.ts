/**
 *
 */
import { Component, Vue } from 'vue-property-decorator';
import draggable from 'vuedraggable';
import Meta from '../models/Meta';
import { display, filter, generateSchedules, schedule } from '../store';

@Component({
    components: {
        draggable
    }
})
export default class FilterView extends Vue {
    get filter() {
        return filter;
    }
    get display() {
        return display;
    }
    get days() {
        return Meta.days;
    }
    dragEnd() {
        if (filter.sortOptions.mode === 0) filter.changeSorting(undefined);
    }

    generateSchedules() {
        generateSchedules();
    }

    changeSorting(optIdx?: number) {
        if (!filter.validateSortOptions()) return;
        if (optIdx !== undefined) {
            const option = filter.sortOptions.sortBy[optIdx];

            if (option.enabled) {
                // disable options that are mutually exclusive to this one
                for (const key of option.exclusive) {
                    for (const opt of filter.sortOptions.sortBy) {
                        if (opt.name === key) opt.enabled = false;
                    }
                }
            }
        }
        if (!window.scheduleEvaluator.empty()) {
            // this.loading = true;
            window.scheduleEvaluator.changeSort(filter.sortOptions, true);
            if (!schedule.generated) {
                schedule.switchSchedule(true);
            } else {
                // re-assign the current schedule
                schedule.currentSchedule = window.scheduleEvaluator.getSchedule(
                    schedule.currentScheduleIndex
                );
            }
            // this.loading = false;
        }
    }
}
