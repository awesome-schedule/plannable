import Schedule from '../models/Schedule';
import { RawAlgoSchedule } from './ScheduleGenerator';
import Meta from '../models/Meta';
import Event from '../models/Event';

export enum Mode {
    fallback = 0,
    combined = 1
}

export interface SortMode {
    mode: Mode;
    title: string;
    description: string;
}

type OrderedBlocks = [number[], number[], number[], number[], number[]];
type OrderedRooms = [string[], string[], string[], string[], string[]];

interface CmpSchedule {
    schedule: RawAlgoSchedule;
    blocks: OrderedBlocks;
    rooms: OrderedRooms;
    coeffs: Float32Array;
    coeff: number;
}

/**
 * A `SortOption` represents a single sort option
 */
export interface SortOption {
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
 * SortOptionJSON is the JSON representation of SortOptions
 *
 * It only keeps the name and non-readonly fields of the SortOptions
 */
export interface SortOptionJSON {
    sortBy: Array<{
        name: string;
        enabled: boolean;
        reverse: boolean;
    }>;
    mode: Mode;
}

export interface SortOptions {
    sortBy: SortOption[];
    mode: Mode;
    toJSON: () => SortOptionJSON;
    fromJSON: (x: SortOptionJSON) => void;
}

class ScheduleEvaluator {
    public static readonly optionDefaults: SortOptions = {
        sortBy: [
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
                exclusive: ['variance', 'compactness', 'lunchTime', 'noEarly'],
                title: `I'm Feeling Lucky`,
                description: 'Sort randomly'
            }
        ],
        mode: Mode.combined,
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
        fromJSON(raw: SortOptionJSON) {
            if (raw && raw.mode && raw.sortBy) {
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

    public static readonly sortModes: SortMode[] = [
        {
            mode: Mode.combined,
            title: 'Combined',
            description: 'Combine all sorting options and given them equal weight'
        },
        {
            mode: Mode.fallback,
            title: 'Fallback',
            description:
                'Sort using the options on top first. If compare equal, sort using the next option.' +
                ' You can drag the sorting options to change their order.'
        }
    ];

    /**
     * defines a number of sorting functions. Note that by default, schedules are sorted in
     * **ascending** order according to the coefficient computed by one or a combination of sorting functions.
     */
    public static sortFunctions: { [x: string]: (schedule: CmpSchedule) => number } = {
        /**
         * compute the variance of class times during the week
         *
         * returns a higher value when the class times are unbalanced
         */
        variance(schedule: CmpSchedule) {
            const blocks = schedule.blocks;
            let sum = 0;
            let sumSq = 0;
            for (let i = 0; i < blocks.length; i++) {
                const day = blocks[i];
                let classTime = 0;
                for (let j = 0; j < day.length; j += 2) {
                    classTime += day[j + 1] - day[j];
                }
                sum += classTime;
                sumSq += classTime ** 2;
            }
            return sumSq / 5 - (sum / 5) ** 2;
        },

        /**
         * compute the vertical compactness of a schedule,
         * defined as the total time in between each pair of consecutive classes
         *
         * The greater the time gap between classes, the greater the return value will be
         */
        compactness(schedule: CmpSchedule) {
            const blocks = schedule.blocks;
            let compact = 0;
            for (const dayBlock of blocks) {
                for (let i = 0; i < dayBlock.length - 3; i += 4) {
                    compact += dayBlock[i + 2] - dayBlock[i + 1];
                }
            }
            return compact;
        },

        /**
         * compute overlap of the classes and the lunch time,
         * defined as the time between 11:00 and 14:00
         *
         * The greater the overlap, the greater the return value will be
         */
        lunchTime(schedule: CmpSchedule) {
            // 11:00 to 14:00
            const lunchStart = 11 * 60;
            const lunchEnd = 14 * 60;
            const lunchMinOverlap = 60;
            const lunchOverlap = new Int32Array(5);
            const blocks = schedule.blocks;
            for (let i = 0; i < 5; i++) {
                const day = blocks[i];
                for (let j = 0; j < day.length; j += 2) {
                    lunchOverlap[i] += ScheduleEvaluator.calcOverlap(
                        lunchStart,
                        lunchEnd,
                        day[j],
                        day[j + 1]
                    );
                }
            }
            let overlap = 0;
            for (let i = 0; i < lunchOverlap.length; i++) {
                const o = lunchOverlap[i];
                if (o > lunchMinOverlap) overlap += o;
            }
            return overlap;
        },

        /**
         * calculate the time between the start time of the earliest class and 22:00
         *
         * For a schedule that has earlier classes, this method will return a higher number
         */
        noEarly(schedule: CmpSchedule) {
            const blocks = schedule.blocks;
            const refTime = 12 * 60;
            let total = 0;
            for (const day of blocks) {
                const time = day[0];
                if (time && time < refTime) {
                    total += (refTime - time) ** 2;
                }
            }

            return total;
        },

        IamFeelingLucky() {
            return Math.random();
        }
    };

    public static getDefaultOptions() {
        const options: SortOptions = Object.assign({}, ScheduleEvaluator.optionDefaults);
        options.sortBy = options.sortBy.map(x => Object.assign({}, x));
        return options;
    }

    public static calcOverlap(a: number, b: number, c: number, d: number) {
        if (a <= c && d <= b) return d - c;
        if (a <= c && c <= b) return b - c;
        else if (a <= d && d <= b) return d - a;
        else if (a >= c && b <= d) return b - a;
        else return 0;
    }

    public static validateOptions(options: SortOptions) {
        if (!options) return ScheduleEvaluator.optionDefaults;
        for (const option of options.sortBy) {
            if (typeof ScheduleEvaluator.sortFunctions[option.name] !== 'function')
                throw new Error(`Non-existent sorting option ${option.name}`);
        }
        return options;
    }

    public schedules: CmpSchedule[];
    public options: SortOptions;
    public events: Event[];

    constructor(options: SortOptions, events: Event[]) {
        this.schedules = [];
        this.options = ScheduleEvaluator.validateOptions(options);
        this.events = events;
    }

    /**
     * Add a schedule to the collection of results.
     * Group the time blocks and sort them in order.
     *
     * @remarks insertion sort is used as there are not many elements in each day array.
     * This method has pretty high overhead
     */
    public add(schedule: RawAlgoSchedule) {
        const days = Meta.days;

        // sort time blocks of courses according to its schedule
        const blocks: OrderedBlocks = [[], [], [], [], []];
        const rooms: OrderedRooms = [[], [], [], [], []];
        for (const course of schedule) {
            for (let k = 0; k < 5; k++) {
                // time blocks and rooms at day k
                const timeBlock = course[1][days[k]] as number[];
                if (!timeBlock) continue;

                // note that a block is a flattened array of TimeBlocks. Flattened only for performance reason
                const block: number[] = blocks[k];

                // const room: string[] = rooms[k];
                // const courseRoom = new Array(timeBlock.length / 2).fill(course[0]);

                // hi = half of i
                for (let i = 0, hi = 0; i < timeBlock.length; i += 2, hi += 1) {
                    // insert timeBlock[i] and timeBlock[i+1] into the correct position in the block array
                    const ele = timeBlock[i];
                    let j = 0,
                        hj = 0;
                    for (; j < block.length; j += 2, hj += 1) {
                        if (ele < block[j]) break;
                    }
                    block.splice(j, 0, ele, timeBlock[i + 1]);
                    // room.splice(hj, 0, courseRoom[hi]);
                }
            }
        }

        this.schedules.push({
            schedule: schedule.concat(),
            blocks,
            rooms,
            coeff: 0,
            coeffs: new Float32Array(1)
        });
    }

    /**
     * whether the random sort option is enabled
     */
    public isRandom() {
        return this.options.sortBy.some(x => x.name === 'IamFeelingLucky' && x.enabled);
    }

    /**
     * pre-compute the coefficient for each schedule using each enabled sorting function
     * so that they don't need to be computed on the fly when sorting
     */
    public computeCoeff() {
        if (this.isRandom()) return;

        const [count, lastIdx] = this.countSortOpt();
        if (this.options.mode === Mode.fallback) {
            console.time('precomputing coefficients');
            // tslint:disable-next-line
            const schedules = this.schedules;
            if (count === 1) {
                const evalFunc = ScheduleEvaluator.sortFunctions[this.options.sortBy[lastIdx].name];
                for (const cmpSchedule of this.schedules) {
                    cmpSchedule.coeff = evalFunc(cmpSchedule);
                }
            } else {
                const evalFuncs = this.options.sortBy
                    .filter(x => x.enabled)
                    .map(x => ScheduleEvaluator.sortFunctions[x.name]);
                const len = evalFuncs.length;
                const ef = evalFuncs[0];
                for (const schedule of schedules) {
                    const arr = new Float32Array(len);
                    arr[0] = ef(schedule);
                    schedule.coeffs = arr;
                }
                for (let i = 1; i < evalFuncs.length; i++) {
                    const evalFunc = evalFuncs[i];
                    for (const schedule of schedules) {
                        schedule.coeffs[i] = evalFunc(schedule);
                    }
                }
            }
            console.timeEnd('precomputing coefficients');
            return;
        }

        const schedules = this.schedules;
        if (count === 1) {
            const option = this.options.sortBy[lastIdx];
            const evalFunc = ScheduleEvaluator.sortFunctions[option.name];
            for (const cmpSchedule of schedules) {
                cmpSchedule.coeff = evalFunc(cmpSchedule);
            }
            return;
        }

        console.time('normalizing coefficients');
        // note: fixed-size typed array is must faster than 'normal' array
        const coeffs = new Float32Array(schedules.length);
        for (const option of this.options.sortBy) {
            if (option.enabled) {
                console.time(`${option.name}`);
                const len = schedules.length;
                const coeff = new Float32Array(len);
                const evalFunc = ScheduleEvaluator.sortFunctions[option.name];
                let max = 0,
                    min = Infinity;
                for (let i = 0; i < len; i++) {
                    const val = evalFunc(schedules[i]);
                    if (val > max) max = val;
                    if (val < min) min = val;
                    coeff[i] = val;
                }
                const range = max - min;
                const normalizeRatio = range / 100;
                if (option.reverse) {
                    for (let i = 0; i < len; i++) {
                        coeffs[i] += ((max - coeff[i]) / normalizeRatio) ** 2;
                    }
                } else {
                    for (let i = 0; i < len; i++) {
                        coeffs[i] += ((coeff[i] - min) / normalizeRatio) ** 2;
                    }
                }
                console.timeEnd(`${option.name}`);
            }
        }
        for (let i = 0; i < schedules.length; i++) schedules[i].coeff = coeffs[i];
        console.timeEnd('normalizing coefficients');
    }

    public countSortOpt() {
        let count = 0;
        let lastIdx: number = -1;
        for (let i = 0; i < this.options.sortBy.length; i++) {
            const option = this.options.sortBy[i];
            if (option.enabled) {
                count++;
                lastIdx = i;
            }
        }
        return [count, lastIdx];
    }

    /**
     * sort the array of schedules according to their quality coefficients computed using the given
     */
    public sort() {
        console.time('sorting: ');

        if (this.isRandom()) {
            this.shuffle(this.schedules as CmpSchedule[]);
            console.timeEnd('sorting: ');
            return;
        }

        const options = this.options.sortBy.filter(x => x.enabled);

        /**
         * The comparator function when there's only one sorting option selected
         */
        const cmpFunc: (a: CmpSchedule, b: CmpSchedule) => number = options[0].reverse
            ? (a, b) => b.coeff - a.coeff
            : (a, b) => a.coeff - b.coeff;
        if (this.options.mode === Mode.combined) {
            // if want to be really fast, use Floyd–Rivest algorithm to select first,
            // say, 100 elements and then sort only these elements
            (this.schedules as CmpSchedule[]).sort(cmpFunc);
        } else {
            if (options.length === 1) (this.schedules as CmpSchedule[]).sort(cmpFunc);
            else {
                const len = options.length;
                const schedules = this.schedules;
                const ifReverse = new Int8Array(len).map((_, i) => (options[i].reverse ? -1 : 1));
                schedules.sort((a, b) => {
                    const c1 = a.coeffs;
                    const c2 = b.coeffs;
                    let r = 0;
                    for (let i = 0; i < len; i++) {
                        r = ifReverse[i] * (c1[i] - c2[i]);
                        if (r) return r;
                    }
                    return r;
                });
            }
        }
        console.timeEnd('sorting: ');
    }

    /**
     * change the sorting method and (optionally) do sorting
     */
    public changeSort(options: SortOptions, doSort = true) {
        this.options = ScheduleEvaluator.validateOptions(options);
        this.computeCoeff();
        if (doSort) this.sort();
    }

    public size() {
        return this.schedules.length;
    }

    /**
     * Get a `Schedule` object at idx
     */
    public getSchedule(idx: number) {
        return new Schedule(this.schedules[idx].schedule, 'Schedule', idx + 1, this.events);
    }
    /**
     * whether this evaluator contains an empty array of schedules
     */
    public empty() {
        return this.schedules.length === 0;
    }

    public clear() {
        this.schedules = [];
    }

    /**
     * Fisher–Yates shuffle algorithm
     * @see https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle
     */
    private shuffle<T>(a: T[]): T[] {
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const x = a[i];
            a[i] = a[j];
            a[j] = x;
        }
        return a;
    }
}
export default ScheduleEvaluator;
