/**
 * The goal of the schedule evaluator is to efficiently sort the generated schedules
 * according to the set of the rules defined by the user
 *
 * @author Hanzhi Zhou
 */

/**
 *
 */
import Schedule from '../models/Schedule';
import { RawAlgoSchedule } from './ScheduleGenerator';
import Meta from '../models/Meta';
import Event from '../models/Event';
import quickselect from 'quickselect';
import { calcOverlap } from '../utils';

type OrderedBlocks = [number[], number[], number[], number[], number[]];
type OrderedRooms = [number[], number[], number[], number[], number[]];

export interface CmpSchedule {
    schedule: RawAlgoSchedule;
    blocks: OrderedBlocks;
    rooms: OrderedRooms;
    coeff: number;
    index: number;
}

export interface SortFunctions {
    [x: string]: (a: CmpSchedule) => number;
    variance: (a: CmpSchedule) => number;
    compactness: (a: CmpSchedule) => number;
    noEarly: (a: CmpSchedule) => number;
    lunchTime: (a: CmpSchedule) => number;
    IamFeelingLucky: (a: CmpSchedule) => number;
}

/**
 * representation of a single sort option
 */
export interface SortOption {
    name: string;
    enabled: boolean;
    reverse: boolean;
}

/**
 * enum for the two sort modes
 */
export enum SortMode {
    fallback = 0,
    combined = 1
}

/**
 * options for the schedule evaluator
 */
export interface EvaluatorOptions {
    sortBy: SortOption[];
    mode: SortMode;
}

class ScheduleEvaluator {
    /**
     * defines a number of sorting functions. Note that by default, schedules are sorted in
     * **ascending** order according to the coefficient computed by one or a combination of sorting functions.
     */
    public static sortFunctions: SortFunctions = {
        /**
         * compute the variance of class times during the week
         *
         * returns a higher value when the class times are unbalanced
         */
        variance(schedule: CmpSchedule) {
            const blocks = schedule.blocks;
            let sum = 0;
            let sumSq = 0;
            for (const day of blocks) {
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
                for (let i = 0; i < dayBlock.length - 3; i += 2) {
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
            const blocks = schedule.blocks;
            let totalOverlap = 0;
            for (let i = 0; i < 5; i++) {
                const day = blocks[i];
                let dayOverlap = 0;
                for (let j = 0; j < day.length; j += 2) {
                    dayOverlap += calcOverlap(lunchStart, lunchEnd, day[j], day[j + 1]);
                }
                if (dayOverlap > lunchMinOverlap) totalOverlap += dayOverlap;
            }
            return totalOverlap;
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

        /**
         * compute the sum of walking distances between each consecutive pair of classes
         */
        distance(schedule: CmpSchedule) {
            const timeMatrix = window.timeMatrix;

            // timeMatrix is actually a flattened matrix, so matrix[i][j] = matrix[i*len+j]
            const len = timeMatrix.length ** 0.5;
            const rooms = schedule.rooms;
            let dist = 0;
            for (const dayRooms of rooms) {
                for (let i = 0; i < dayRooms.length - 1; i++) {
                    const r1 = dayRooms[i];
                    const r2 = dayRooms[i + 1];

                    // skip unknown buildings
                    if (r1 === -1 || r2 === -1) continue;
                    dist += timeMatrix[r1 * len + r2];
                }
            }
            return dist;
        },

        IamFeelingLucky() {
            return Math.random();
        }
    };

    public options: EvaluatorOptions;
    /**
     * the array of events kept, use to construct generated schedules
     */
    public events: Event[];
    /**
     * _schedules keeps the schedules in insertion order,
     * so that we can cache the sorting coefficient of each schedule
     */
    public _schedules: CmpSchedule[] = [];

    /**
     * this is the sorted array of schedules, created after the first invocation of `sort`
     */
    public schedules: CmpSchedule[] = [];

    /**
     * the cache of coefficient array for each evaluating function
     */
    private sortCoeffCache: { [x in keyof SortFunctions]?: Float32Array } = {};

    constructor(options: EvaluatorOptions, events: Event[] = []) {
        this.options = options;
        this.events = events;
    }

    /**
     * Add a schedule to the collection of results.
     * Group the time blocks and sort them in order.
     *
     * @remarks insertion sort is used as there are not many elements in each day array.
     * @remarks This method has a high performance overhead.
     */
    public add(schedule: RawAlgoSchedule) {
        const days = Meta.days;

        // sort time blocks of courses according to its schedule
        const blocks: OrderedBlocks = [[], [], [], [], []];
        const rooms: OrderedRooms = [[], [], [], [], []];
        for (const course of schedule) {
            const timeDict = course[1];
            const roomDict = course[3];
            for (let k = 0; k < 5; k++) {
                // time blocks and rooms at day k
                const day = days[k];
                const timeBlock = timeDict[day];
                const roomBlock = roomDict[day]!;
                if (!timeBlock) continue;

                // note that a block is a flattened array of TimeBlocks. Flattened only for performance reason
                const block: number[] = blocks[k];
                const room: number[] = rooms[k];

                // hi = half of i
                for (let i = 0, hi = 0; i < timeBlock.length; i += 2, hi += 1) {
                    // insert timeBlock[i] and timeBlock[i+1] into the correct position in the block array
                    const ele = timeBlock[i];
                    let j = 0,
                        hj = 0;
                    for (; j < block.length; j += 2, hj += 1) if (ele < block[j]) break;

                    block.splice(j, 0, ele, timeBlock[i + 1]);
                    room.splice(hj, 0, roomBlock[hi]);
                }
            }
        }

        this._schedules.push({
            schedule: schedule.concat(),
            blocks,
            rooms,
            coeff: 0,
            index: this._schedules.length
        });
    }

    /**
     * whether the random sort option is enabled
     */
    public isRandom() {
        return this.options.sortBy.some(x => x.name === 'IamFeelingLucky' && x.enabled);
    }

    /**
     * compute the coefficient array for a specific sorting option.
     * if it exists, don't do anything
     *
     * @param funcName the name of the sorting option
     * @param assign whether assign to the `coeff` field of each `CmpSchedule`
     * @returns the computed/cached array of coefficients
     */
    public computeCoeffFor(funcName: string, assign: boolean): Float32Array {
        const schedules = this._schedules;
        const cache = this.sortCoeffCache[funcName];
        if (cache) {
            if (assign) for (let i = 0; i < schedules.length; i++) schedules[i].coeff = cache[i];
            return cache;
        } else {
            console.time(funcName);

            const evalFunc = ScheduleEvaluator.sortFunctions[funcName];
            const newCache = new Float32Array(schedules.length);
            if (assign) {
                for (let i = 0; i < schedules.length; i++) {
                    const cmpSchedule = schedules[i];
                    const val = evalFunc(cmpSchedule);
                    newCache[i] = schedules[i].coeff = val;
                }
            } else {
                for (let i = 0; i < schedules.length; i++) {
                    newCache[i] = evalFunc(schedules[i]);
                }
            }

            this.sortCoeffCache[funcName] = newCache;
            console.timeEnd(funcName);

            return newCache;
        }
    }

    /**
     * pre-compute the coefficient for each schedule using each enabled sorting function
     * so that they don't need to be computed on the fly when sorting
     */
    public computeCoeff() {
        if (this.isRandom()) return;

        const [count, lastIdx] = this.countSortOpt();
        const schedules = this._schedules;

        // if there's only one option enabled, just compute coefficients for it and
        // assign to the .coeff field for each schedule
        if (count === 1) {
            this.computeCoeffFor(this.options.sortBy[lastIdx].name, true);
            return;
        }

        if (this.options.mode === SortMode.fallback) {
            console.time('precomputing coefficients');
            this.options.sortBy
                .filter(x => x.enabled)
                .forEach(x => {
                    this.computeCoeffFor(x.name, false);
                });

            console.timeEnd('precomputing coefficients');
        } else {
            console.time('normalizing coefficients');

            const options = this.options.sortBy.filter(x => x.enabled);
            const len = schedules.length;
            const coeffs = new Float32Array(len);

            // finding the minimum and maximum is quite fast for 1e6 elements, so not cached.
            for (const option of options) {
                const coeff = this.computeCoeffFor(option.name, false);

                let max = -Infinity,
                    min = Infinity;
                for (let i = 0; i < len; i++) {
                    const val = coeff[i];
                    if (val > max) max = val;
                    if (val < min) min = val;
                }

                const range = max - min;

                // if all of the values are the same, skip this sorting coefficient
                if (!range) {
                    console.warn(range, option.name);
                    continue;
                }

                const normalizeRatio = range / 100;

                // use Euclidean distance to combine multiple sorting coefficients
                if (option.reverse) {
                    for (let i = 0; i < len; i++) {
                        coeffs[i] += ((max - coeff[i]) / normalizeRatio) ** 2;
                    }
                } else {
                    for (let i = 0; i < len; i++) {
                        coeffs[i] += ((coeff[i] - min) / normalizeRatio) ** 2;
                    }
                }
            }

            for (let i = 0; i < schedules.length; i++) schedules[i].coeff = coeffs[i];
            console.timeEnd('normalizing coefficients');
        }
    }

    /**
     * count the number of sort options enabled.
     *
     * @returns [number of sort options enabled, the index of the last enabled sort option]
     */
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
     * sort the array of schedules according to their quality coefficients, assuming they are already computed
     * by `computeCoeff`
     *
     * @param quick quick mode: use Floyd–Rivest algorithm to select first
     * 100 elements and then sort only these elements.
     * @param quickThresh Automatically enable quick mode if the length of schedules is greater than `quickThresh`
     *
     * @see {@link https://en.wikipedia.org/wiki/Floyd%E2%80%93Rivest_algorithm}
     */
    public sort(quick = false, quickThresh = 50000) {
        console.time('sorting: ');

        const schedules = this._schedules.concat();
        this.schedules = schedules;

        if (this.isRandom()) {
            this.shuffle(this.schedules);
            console.timeEnd('sorting: ');
            return;
        }

        const options = this.options.sortBy.filter(x => x.enabled);
        const isCombined = this.options.mode === SortMode.combined;

        /**
         * The comparator function when there's only one sorting option selected
         *
         * if only one option is enabled, the sort direction depends on the `reversed` property of it
         *
         * if multiple sort options are enabled and the sort mode is combined, which means
         * `(!isCombined || options.length === 1)` is false, the `computeCoeff` method
         * is already taken care of the sort direction of each function, so we sort in ascending order anyway
         */
        const cmpFunc: (a: CmpSchedule, b: CmpSchedule) => number =
            options[0].reverse && (!isCombined || options.length === 1)
                ? (a, b) => b.coeff - a.coeff // descending
                : (a, b) => a.coeff - b.coeff; // ascending

        if (isCombined || options.length === 1) {
            if (quick || schedules.length > quickThresh) {
                this.partialSort(schedules, cmpFunc, 1000);
            } else {
                schedules.sort(cmpFunc);
            }
        } else {
            const len = options.length;

            // if option[i] is reverse, ifReverse[i] will be -1
            const ifReverse = new Int32Array(len).map((_, i) => (options[i].reverse ? -1 : 1));
            const coeffs = options.map(x => this.sortCoeffCache[x.name]!);
            const func = (a: CmpSchedule, b: CmpSchedule) => {
                let r = 0;
                for (let i = 0; i < len; i++) {
                    const coeff = coeffs[i];
                    // calculate the difference in coefficients
                    r = ifReverse[i] * (coeff[a.index] - coeff[b.index]);

                    // if non-zero, returns this coefficient
                    if (r) return r;

                    // otherwise, fallback to the next sort option
                }
                return r;
            };
            if (quick || schedules.length > quickThresh) {
                this.partialSort(schedules, func, 1000);
            } else {
                schedules.sort(func);
            }
        }
        console.timeEnd('sorting: ');
    }

    /**
     * use Floyd–Rivest selection algorithm to select `num` smallest elements.
     * Then, sort these elements in order.
     *
     * @see https://en.wikipedia.org/wiki/Floyd%E2%80%93Rivest_algorithm
     * @see https://github.com/mourner/quickselect
     */
    public partialSort<T>(arr: T[], compare: (x: T, y: T) => number, num: number) {
        quickselect(arr, num, 0, arr.length - 1, compare);
        const slc = arr.slice(0, num).sort(compare);
        for (let i = 0; i < num; i++) arr[i] = slc[i];
    }

    /**
     * change the sorting method and (optionally) do sorting
     */
    public changeSort(options: EvaluatorOptions, doSort = true) {
        this.options = options;
        this.computeCoeff();
        if (doSort) this.sort();
    }

    public size() {
        return this._schedules.length;
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
        return this._schedules.length === 0;
    }

    public clear() {
        this._schedules = this.schedules = [];
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
