/**
 *
 */
import { Vue, Component } from 'vue-property-decorator';
import filter from '../store/filter';
import display from '../store/display';
import Meta from '../models/Meta';
import App from '../App';
import draggable from 'vuedraggable';
import schedule from '@/store/schedule';

@Component({
    components: {
        draggable
    }
})
export default class FilterView extends Vue {
    $parent!: App;
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

    // @Watch('display.combineSections')
    // combineSectionsWatch() {
    //     if (this.generated) this.generateSchedules();
    //     this.currentSchedule.computeSchedule();
    // }

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
