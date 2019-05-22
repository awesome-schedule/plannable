/**
 *
 */
import { Vue, Component } from 'vue-property-decorator';
import ScheduleEvaluator from '@/algorithm/ScheduleEvaluator';
import noti from './notification';
import Meta from '@/models/Meta';
import Event from '../models/Event';
import { to12hr } from '@/utils';

const _defaultFilter = {
    timeSlots: [] as Array<[boolean, boolean, boolean, boolean, boolean, string, string]>,
    allowWaitlist: true,
    allowClosed: true,
    sortOptions: ScheduleEvaluator.getDefaultOptions()
};

type _FilterState = typeof _defaultFilter;

export interface FilterState extends _FilterState {
    [x: string]: any;
}

@Component
export class FilterStore extends Vue implements FilterState {
    [x: string]: any;
    /**
     * index 0 - 4: whether Mo - Fr are selected
     *
     * 6: start time, of 24 hour format
     *
     * 7: end time, of 24 hour format
     */
    timeSlots: Array<[boolean, boolean, boolean, boolean, boolean, string, string]> = [];
    allowWaitlist = true;
    allowClosed = true;
    sortOptions = ScheduleEvaluator.getDefaultOptions();
    sortModes = ScheduleEvaluator.sortModes;

    updateFilterDay(i: number, j: number) {
        this.$set(this.timeSlots[i], j, !this.timeSlots[i][j]);
    }

    validateSortOptions() {
        if (!Object.values(this.sortOptions.sortBy).some(x => x.enabled)) {
            noti.error('You must have at least one sort option!');
            return false;
        } else if (
            Object.values(this.sortOptions.sortBy).some(x => x.name === 'distance' && x.enabled) &&
            (!window.buildingList || !window.timeMatrix)
        ) {
            noti.error('Building list fails to load. Please disable "walking distance"');
            return false;
        }
        return true;
    }

    changeSorting(optIdx?: number) {
        if (!this.validateSortOptions()) return;
        if (optIdx !== undefined) {
            const option = this.sortOptions.sortBy[optIdx];

            if (option.enabled) {
                // disable options that are mutually exclusive to this one
                for (const key of option.exclusive) {
                    for (const opt of this.sortOptions.sortBy) {
                        if (opt.name === key) opt.enabled = false;
                    }
                }
            }
        }
        if (!window.scheduleEvaluator.empty()) {
            // this.loading = true;
            window.scheduleEvaluator.changeSort(this.sortOptions, true);
            // if (!this.generated) {
            //     this.switchSchedule(true);
            // } else {
            //     // re-assign the current schedule
            //     this.currentSchedule = window.scheduleEvaluator.getSchedule(
            //         this.currentScheduleIndex
            //     );
            // }
            // this.loading = false;
        }
    }

    addTimeSlot() {
        this.timeSlots.push([false, false, false, false, false, '', '']);
    }
    removeTimeSlot(n: number) {
        this.timeSlots.splice(n, 1);
    }

    /**
     * Preprocess the time filters and convert them to array of event.
     * returns null on parsing error
     */
    computeFilter(): Event[] | null {
        const timeSlotsRecord = [];
        for (const time of this.timeSlots) {
            let days = '';
            for (let j = 0; j < 5; j++) {
                if (time[j]) days += Meta.days[j];
            }

            if (!days) continue;

            const startTime = time[5].split(':');
            const endTime = time[6].split(':');
            if (
                isNaN(+startTime[0]) ||
                isNaN(+startTime[1]) ||
                isNaN(+endTime[0]) ||
                isNaN(+endTime[1])
            ) {
                noti.error('Invalid time input.');
                return null;
            }
            days += ' ' + to12hr(time[5]) + ' - ' + to12hr(time[6]);
            timeSlotsRecord.push(new Event(days, false));
        }
        return timeSlotsRecord;
    }

    update(newFilter: Partial<FilterState>) {
        for (const key in newFilter) {
            this[key] = newFilter[key];
        }
    }

    toJSON() {
        const result: Partial<FilterState> = {};
        for (const key in _defaultFilter) {
            result[key] = this[key];
        }
        return result;
    }
}

export const filter = new FilterStore();
export default filter;
