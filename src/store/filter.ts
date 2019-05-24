/**
 * the filter module handles manipulation of filters
 * @author Hanzhi Zhou
 */

/**
 *
 */
import { SortMode, EvaluatorOptions, SortOption } from '../algorithm/ScheduleEvaluator';
import { toJSON, StoreModule } from '.';

interface FilterStateBase {
    [x: string]: any;
    timeSlots: [boolean, boolean, boolean, boolean, boolean, string, string][];
    allowWaitlist: boolean;
    allowClosed: boolean;
}

export interface FilterState extends FilterStateBase {
    sortOptions: DetailedEvaluatorOptions;
}

export interface FilterStateJSON extends FilterStateBase {
    sortOptions: EvaluatorOptions;
}

/**
 * a sort mode with detailed description
 */
interface DetailedSortMode {
    readonly mode: SortMode;
    readonly title: string;
    readonly description: string;
}

/**
 * A sort option with detailed description
 * @see [[SortOption]]
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
    readonly exclusive: ReadonlyArray<string>;
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
    sortBy: ReadonlyArray<DetailedSortOption>;
    mode: SortMode;
    toJSON: () => EvaluatorOptions;
    fromJSON: (x?: EvaluatorOptions) => DetailedEvaluatorOptions;
}

/**
 * a list of sort options with default values assigned
 */
const defaultOptions: DetailedEvaluatorOptions = {
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
    const options: DetailedEvaluatorOptions = Object.assign({}, defaultOptions);
    options.sortBy = options.sortBy.map(x => Object.assign({}, x));
    return options;
}

class FilterStore implements StoreModule<FilterState, FilterStateJSON> {
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

    readonly sortModes: ReadonlyArray<DetailedSortMode> = [
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

    fromJSON(obj: Partial<FilterStateJSON>) {
        const defaultVal = this.getDefault();
        this.timeSlots = obj.timeSlots instanceof Array ? obj.timeSlots : defaultVal.timeSlots;
        this.allowClosed =
            typeof obj.allowClosed === 'boolean' ? obj.allowClosed : defaultVal.allowClosed;
        this.allowWaitlist =
            typeof obj.allowWaitlist === 'boolean' ? obj.allowWaitlist : defaultVal.allowWaitlist;
        this.sortOptions = defaultVal.sortOptions.fromJSON(obj.sortOptions);
    }

    toJSON(): FilterStateJSON {
        return toJSON<FilterState, FilterStateJSON>(this);
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
