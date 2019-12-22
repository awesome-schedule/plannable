/**
 * @module store
 */

/**
 *
 */
import Event from '@/models/Event';
import { DAYS } from '@/models/Meta';
import Schedule, { ScheduleAll, SectionJSON } from '@/models/Schedule';
import ProposedSchedule from '@/models/ProposedSchedule';
import { to12hr } from '@/utils';
import { StoreModule } from '.';
import ScheduleEvaluator, {
    EvaluatorOptions,
    SortFunctions,
    SortMode,
    SortOption
} from '../algorithm/ScheduleEvaluator';
import noti, { NotiMsg } from './notification';
import GeneratedSchedule from '@/models/GeneratedSchedule';

interface FilterStateBase {
    readonly timeSlots: TimeSlot[];
    allowWaitlist: boolean;
    allowClosed: boolean;
}

export interface FilterState extends FilterStateBase {
    sortOptions: DetailedEvaluatorOptions;
    refSchedule: GeneratedSchedule['All'];
}

export interface FilterStateJSON extends FilterStateBase {
    sortOptions: EvaluatorOptions;
    refSchedule: ScheduleAll<SectionJSON[][]>;
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
export type TimeSlot = [
    boolean,
    boolean,
    boolean,
    boolean,
    boolean,
    boolean,
    boolean,
    string,
    string
];
export type TimeSlotShort = [number, string, string];

/**
 * a list of sort options with default values assigned
 */
const defaultOptions: DetailedEvaluatorOptions = {
    sortBy: [
        {
            name: 'distance',
            enabled: true,
            reverse: false,
            weight: 1,
            exclusive: ['IamFeelingLucky'],
            title: 'Walking Distance',
            description: 'Avoid long distance walking between classes'
        },
        {
            name: 'variance',
            enabled: true,
            reverse: false,
            weight: 1,
            exclusive: ['IamFeelingLucky'],
            title: 'Variance',
            description: 'Balance the class time each day'
        },
        {
            name: 'compactness',
            enabled: false,
            reverse: false,
            weight: 1,
            exclusive: ['IamFeelingLucky'],
            title: 'Vertical compactness',
            description: 'Make classes back-to-back'
        },
        {
            name: 'lunchTime',
            enabled: false,
            reverse: false,
            weight: 1,
            exclusive: ['IamFeelingLucky'],
            title: 'Lunch Time',
            description: 'Leave spaces for lunch'
        },
        {
            name: 'noEarly',
            enabled: false,
            reverse: false,
            weight: 1,
            exclusive: ['IamFeelingLucky'],
            title: 'No Early',
            description: 'Start my day as late as possible'
        },
        {
            name: 'similarity',
            enabled: false,
            reverse: false,
            weight: 1,
            exclusive: ['IamFeelingLucky'],
            title: 'Similarity',
            description: 'Similar to a selected schedule'
        },
        {
            name: 'IamFeelingLucky',
            enabled: false,
            reverse: false,
            weight: 1,
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
                reverse: x.reverse,
                weight: x.weight
            })),
            mode: this.mode
        };
    },
    fromJSON(raw?: EvaluatorOptions) {
        if (raw && raw.mode !== undefined && raw.sortBy) {
            this.mode = raw.mode;
            for (const rawSort of raw.sortBy) {
                for (const sort of this.sortBy) {
                    if (sort.name === rawSort.name) {
                        sort.enabled = rawSort.enabled;
                        sort.reverse = rawSort.reverse;
                        sort.weight = rawSort.weight || 1;
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
window.scheduleEvaluator = new ScheduleEvaluator();

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
        const weights: number[] = [];
        for (const sortBy of obj.sortOptions.sortBy) {
            initials.push(sortBy.name.charCodeAt(0));
            if (sortBy.enabled) sortBits |= mask;
            mask <<= 1;
            if (sortBy.reverse) sortBits |= mask;
            mask <<= 1;
            weights.push(sortBy.weight);
        }
        const { payload: schedule, level, msg } = ProposedSchedule.fromJSON({
            All: obj.refSchedule,
            events: []
        });
        if (level === 'warn')
            noti.warn(
                'Warning: Reference schedule used in sort by similarity is removed because <br>' +
                    msg
            );

        return [
            filterBits,
            sortBits,
            initials,
            weights,
            // use 7 bits to represent the 7 days
            obj.timeSlots.map(timeSlot => {
                let m = 1,
                    flag = 0;
                for (let i = 0; i < 7; i++) {
                    if (timeSlot[i]) flag |= m;
                    m <<= 1;
                }
                return [flag, timeSlot[7], timeSlot[8]] as const;
            }),
            // we ignore the events
            schedule && level !== 'warn' ? Schedule.compressJSON(schedule.toJSON())[0] : {}
        ] as const;
    }

    public static decompressJSON(obj: ReturnType<typeof FilterStore.compressJSON>) {
        const filter = new FilterStore();
        const [filterBits, sortBits, initials, weights, slots, ref] = obj;

        // get allowClosed, allowWaitlist, mode from binary
        filter.allowClosed = Boolean(filterBits & 1);
        filter.allowWaitlist = Boolean(filterBits & 2);
        filter.sortOptions.mode = +Boolean(filterBits & 4); // convert to 0 or 1

        // decode time slots
        filter.timeSlots = slots.map(slot => {
            const timeSlot: TimeSlot = [
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                slot[1],
                slot[2]
            ];
            const bits = slot[0];
            let m = 1;
            for (let i = 0; i < 7; i++) {
                timeSlot[i] = Boolean(m & bits);
                m <<= 1;
            }
            return timeSlot;
        });

        // decode the enable and reverse info of sort
        const sortBy = filter.sortOptions.sortBy;
        const sortCopy = [];
        // loop through the ascii initials and match to the object name
        let mask = 1;
        for (let i = 0; i < initials.length; i++) {
            const initial = initials[i];
            const sortOpt = sortBy.find(s => s.name.charCodeAt(0) === initial)!;

            // if matched, decode the enabled and reverse info from the binary
            sortOpt.enabled = Boolean(sortBits & mask);
            mask <<= 1;

            sortOpt.reverse = Boolean(sortBits & mask);
            mask <<= 1;

            sortOpt.weight = weights[i];

            sortCopy.push(sortOpt);
        }
        filter.sortOptions.sortBy = sortCopy;
        const { payload: schedule, level } = ProposedSchedule.fromJSON(
            Schedule.decompressJSON([ref])
        );
        if (schedule && level !== 'warn') filter.refSchedule = schedule.All as any; // this guarantees to be a generated schedule
        return filter.toJSON();
    }

    timeSlots: TimeSlot[] = [];
    allowWaitlist = true;
    allowClosed = true;
    sortOptions = getDefaultOptions();
    refSchedule: GeneratedSchedule['All'] = {};
    readonly sortModes = [
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
    ] as const;

    get similarityEnabled() {
        return Object.keys(this.refSchedule).length !== 0;
    }

    addTimeSlot() {
        this.timeSlots.push([false, false, false, false, false, false, false, '', '']);
    }
    removeTimeSlot(n: number) {
        this.timeSlots.splice(n, 1);
    }

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

        const { payload: schedule, level, msg } = ProposedSchedule.fromJSON({
            All: obj.refSchedule || {},
            events: []
        });
        if (level === 'warn')
            noti.warn(
                'Warning: Reference schedule used in sort by similarity is removed because <br>' +
                    msg
            );
        // this guarantees to be a generated schedule
        this.refSchedule =
            schedule && level !== 'warn' ? (schedule.All as any) : defaultVal.refSchedule;
    }

    toJSON(): FilterStateJSON {
        // exclude sort modes
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { sortModes, refSchedule: ref, ...others } = this;
        const refSchedule = new ProposedSchedule(ref).toJSON().All as any; // this guarantees to be a generated schedule
        return { refSchedule, ...others };
    }

    getDefault() {
        return new FilterStore();
    }
}

export default new FilterStore();
