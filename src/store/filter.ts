/**
 * @module store
 */
import Event from '@/models/Event';
import { DAYS } from '@/models/Meta';
import { to12hr } from '@/utils';
import { StoreModule } from '.';
import ScheduleEvaluator, {
    EvaluatorOptions,
    SortFunctions,
    SortMode,
    SortOption
} from '../algorithm/ScheduleEvaluator';
import { NotiMsg } from './notification';

interface FilterStateBase {
    readonly timeSlots: TimeSlot[];
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
     * the names of the sorting options that cannot be applied when this option is enabled
     */
    readonly exclusive: readonly (keyof SortFunctions)[];
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
    sortBy: readonly DetailedSortOption[];
    toJSON: () => EvaluatorOptions;
    fromJSON: (x?: EvaluatorOptions) => DetailedEvaluatorOptions;
}

/**
 * index 0 - 6: whether Mo - Su are selected
 *
 * 7: start time, of 24 hour format
 *
 * 8: end time, of 24 hour format
 */
export type TimeSlot = [boolean, boolean, boolean, boolean, boolean, boolean, boolean, string, string];

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
            name: 'similarity',
            enabled: false,
            reverse: false,
            exclusive: ['IamFeelingLucky'],
            title: 'similarity',
            description: 'Similar to a selected schedule'
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
    const options = Object.assign({}, defaultOptions);
    options.sortBy = options.sortBy.map(x => Object.assign({}, x));
    return options;
}

// this property must be non-reactive,
// otherwise the reactive observer will slow down execution significantly
window.scheduleEvaluator = new ScheduleEvaluator(getDefaultOptions(), window.timeMatrix);

/**
 * the filter module handles the storage and manipulation of filters
 * @author Hanzhi Zhou
 */
export class FilterStore implements StoreModule<FilterState, FilterStateJSON> {
    public static compressJSON(obj: FilterStateJSON) {
        // convert allowClosed, allowWaitlist, mode to binary
        let filterBits = 0;
        if (obj.allowClosed) filterBits += 2 ** 0;
        if (obj.allowWaitlist) filterBits += 2 ** 1;
        if (obj.sortOptions.mode === 1) filterBits += 2 ** 2;

        // sorting
        // add all initial ascii to the array in order
        // add the binary of their respective state: enabled or reverse
        let mask = 1;
        let sortBits = 0;

        // name_initial ascii code :[c,d,l,n,s,v,I] --> could change in order
        const initials: number[] = [];
        for (const sortBy of obj.sortOptions.sortBy) {
            initials.push(sortBy.name.charCodeAt(0));
            if (sortBy.enabled) sortBits |= mask;
            mask <<= 1;
            if (sortBy.reverse) sortBits |= mask;
            mask <<= 1;
        }
        return [
            filterBits,
            sortBits,
            initials,
            // convert bool to 0 or 1
            obj.timeSlots.map(slot => slot.map((x, i) => i < 7 ? +x : x)),
        ] as const;
    }

    public static decompressJSON(obj: ReturnType<typeof FilterStore.compressJSON>) {
        // tslint:disable-next-line: no-shadowed-variable
        const filter = new FilterStore();
        const [filterBits, sortBits, initials, slots] = obj;

        // get allowClosed, allowWaitlist, mode from binary
        filter.allowClosed = Boolean(filterBits & 1);
        filter.allowWaitlist = Boolean(filterBits & 2);
        filter.sortOptions.mode = +Boolean(filterBits & 4); // convert to 0 or 1

        // decode time slots
        filter.timeSlots = slots.map(slot => slot.map((x, i) => i < 7 ? Boolean(x) : x) as TimeSlot);

        // decode the enable and reverse info of sort
        const sortBy = filter.sortOptions.sortBy;
        const sortCopy = [];
        // loop through the ascii initials and match to the object name
        let mask = 1;
        for (const initial of initials) {
            const sortOpt = sortBy.find(s => s.name.charCodeAt(0) === initial)!;

            // if matched, decode the enabled and reverse info from the binary
            sortOpt.enabled = Boolean(sortBits & mask);
            mask <<= 1;

            sortOpt.reverse = Boolean(sortBits & mask);
            mask <<= 1;

            sortCopy.push(sortOpt);
        }
        filter.sortOptions.sortBy = sortCopy;
        return filter.toJSON();
    }

    timeSlots: TimeSlot[] = [];
    allowWaitlist = true;
    allowClosed = true;
    sortOptions = getDefaultOptions();

    readonly sortModes: readonly DetailedSortMode[] = [
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

    /**
     * Preprocess the time filters and convert them to an array of event.
     * returns null on parsing error
     */
    computeFilter(): NotiMsg<Event[]> {
        const events: Event[] = [];

        // no time slots => no time filter
        if (!this.timeSlots.length)
            return {
                msg: 'no filters',
                level: 'success',
                payload: events
            };

        for (const time of this.timeSlots) {
            let days = '';
            for (let j = 0; j < 7; j++) {
                if (time[j]) days += DAYS[j];
            }

            if (!days) continue;

            const startTime = time[7].split(':');
            const endTime = time[8].split(':');
            if (
                isNaN(+startTime[0]) ||
                isNaN(+startTime[1]) ||
                isNaN(+endTime[0]) ||
                isNaN(+endTime[1])
            ) {
                return {
                    msg: 'Invalid time input! Please check your filters.',
                    level: 'error'
                };
            }
            days += ' ' + to12hr(time[7]) + ' - ' + to12hr(time[8]);
            events.push(new Event(days, false));
        }

        if (!events.length)
            return {
                msg: 'You need to select at least one day! Please check your filters.',
                level: 'error'
            };

        return {
            msg: 'success',
            level: 'success',
            payload: events
        };
    }

    fromJSON(obj: Partial<FilterStateJSON>) {
        const defaultVal = this.getDefault();
        this.timeSlots = obj.timeSlots instanceof Array ? obj.timeSlots : defaultVal.timeSlots;
        this.allowClosed =
            typeof obj.allowClosed === 'boolean' ? obj.allowClosed : defaultVal.allowClosed;
        this.allowWaitlist =
            typeof obj.allowWaitlist === 'boolean' ? obj.allowWaitlist : defaultVal.allowWaitlist;
        this.sortOptions = defaultVal.sortOptions.fromJSON(obj.sortOptions);
    }

    toJSON() {
        // exclude sort modes
        const { sortModes, ...others } = this as FilterStore;
        return others as FilterStateJSON;
    }

    getDefault() {
        return new FilterStore();
    }
}

export const filter = new FilterStore();
export default filter;
