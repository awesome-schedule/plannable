/**
 *
 */
import { Vue, Component } from 'vue-property-decorator';
import { SortMode, EvaluatorOptions, SortOption } from '../algorithm/ScheduleEvaluator';
import noti from './notification';
import Meta from '../models/Meta';
import Event from '../models/Event';
import { to12hr } from '../utils';
import { toJSON } from './helper';

export interface FilterState {
    [x: string]: any;
    timeSlots: [boolean, boolean, boolean, boolean, boolean, string, string][];
    allowWaitlist: boolean;
    allowClosed: boolean;
    sortOptions: DetailedEvaluatorOptions;
}

/**
 * a sort mode with detaield description
 */
interface DetailedSortMode {
    readonly mode: SortMode;
    readonly title: string;
    readonly description: string;
}

/**
 * A sort option with detailed description
 */
interface DetailedSortOption extends SortOption {
    /**
     * name of this sorting option
     */
    readonly name: string;
    /**
     * whether or not this option is enabled
     */
    enabled: boolean;
    /**
     * whether to sort in reverse
     */
    reverse: boolean;
    /**
     * the names of the sorting options that cannot be applied when this option is enabled
     */
    readonly exclusive: string[];
    /**
     * text displayed next to the checkbox
     */
    readonly title: string;
    /**
     * text displayed in tooltip
     */
    readonly description: string;
}

/**
 * A JSON-serializable version of the [[EvaluatorOptions]] with more details
 */
interface DetailedEvaluatorOptions extends EvaluatorOptions {
    sortBy: DetailedSortOption[];
    mode: SortMode;
    toJSON: () => EvaluatorOptions;
    fromJSON: (x?: EvaluatorOptions) => DetailedEvaluatorOptions;
}

const optionDefaults: DetailedEvaluatorOptions = {
    sortBy: [
        {
            name: 'distance',
            enabled: true,
            reverse: false,
            exclusive: ['IamFeelingLucky'],
            title: 'Walking Distance',
            description: 'Avoid long distance walking between classes'
        },
        {
            name: 'variance',
            enabled: true,
            reverse: false,
            exclusive: ['IamFeelingLucky'],
            title: 'Variance',
            description: 'Balance the class time each day'
        },
        {
            name: 'compactness',
            enabled: false,
            reverse: false,
            exclusive: ['IamFeelingLucky'],
            title: 'Vertical compactness',
            description: 'Make classes back-to-back'
        },
        {
            name: 'lunchTime',
            enabled: false,
            reverse: false,
            exclusive: ['IamFeelingLucky'],
            title: 'Lunch Time',
            description: 'Leave spaces for lunch'
        },
        {
            name: 'noEarly',
            enabled: false,
            reverse: false,
            exclusive: ['IamFeelingLucky'],
            title: 'No Early',
            description: 'Start my day as late as possible'
        },
        {
            name: 'IamFeelingLucky',
            enabled: false,
            reverse: false,
            exclusive: ['variance', 'compactness', 'lunchTime', 'noEarly', 'distance'],
            title: `I'm Feeling Lucky`,
            description: 'Sort randomly'
        }
    ],
    mode: SortMode.combined,
    toJSON() {
        return {
            sortBy: this.sortBy.map(x => ({
                name: x.name,
                enabled: x.enabled,
                reverse: x.reverse
            })),
            mode: this.mode
        };
    },
    fromJSON(raw?: EvaluatorOptions) {
        if (raw && raw.mode !== undefined && raw.sortBy) {
            this.mode = raw.mode;
            for (const raw_sort of raw.sortBy) {
                for (const sort of this.sortBy) {
                    if (sort.name === raw_sort.name) {
                        sort.enabled = raw_sort.enabled;
                        sort.reverse = raw_sort.reverse;
                        break;
                    }
                }
            }
        }
        return this;
    }
};

/**
 * get a copy of the default options
 */
function getDefaultOptions() {
    const options: DetailedEvaluatorOptions = Object.assign({}, optionDefaults);
    options.sortBy = options.sortBy.map(x => Object.assign({}, x));
    return options;
}

@Component
class FilterStore extends Vue implements FilterState {
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
    sortOptions = getDefaultOptions();

    readonly sortModes: DetailedSortMode[] = [
        {
            mode: SortMode.combined,
            title: 'Combined',
            description: 'Combine all sorting options enabled and given them equal weight'
        },
        {
            mode: SortMode.fallback,
            title: 'Fallback',
            description:
                'Sort using the options on top first. If compare equal, sort using the next option.' +
                ' You can drag the sorting options to change their order.'
        }
    ];

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
        const timeSlotsRecord: Event[] = [];
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

    fromJSON(obj: Partial<FilterState>) {
        const defaultVal = this.getDefault();
        this.timeSlots = obj.timeSlots instanceof Array ? obj.timeSlots : defaultVal.timeSlots;
        this.allowClosed =
            typeof obj.allowClosed === 'boolean' ? obj.allowClosed : defaultVal.allowClosed;
        this.allowWaitlist =
            typeof obj.allowWaitlist === 'boolean' ? obj.allowWaitlist : defaultVal.allowWaitlist;
        this.sortOptions = defaultVal.sortOptions.fromJSON(obj.sortOptions);
    }

    toJSON() {
        return toJSON(this);
    }

    getDefault(): FilterState {
        return {
            timeSlots: [] as Array<[boolean, boolean, boolean, boolean, boolean, string, string]>,
            allowWaitlist: true,
            allowClosed: true,
            sortOptions: getDefaultOptions()
        };
    }
}

export const filter = new FilterStore();
export default filter;
