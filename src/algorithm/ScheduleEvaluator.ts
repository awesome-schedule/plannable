/**
 * @module algorithm
 * @author Hanzhi Zhou
 */

/**
 *
 */
import quickselect from 'quickselect';
import Event from '../models/Event';
import Schedule from '../models/Schedule';
import { calcOverlap } from '../utils';
import { RawAlgoSchedule, TimeArray } from './ScheduleGenerator';

export interface CmpSchedule {
    readonly schedule: RawAlgoSchedule;
    readonly blocks: TimeArray;
    readonly index: number;
    coeff: number;
}

export type SortFunctions = typeof ScheduleEvaluator.sortFunctions;

/**
 * representation of a single sort option
 */
export interface SortOption {
    /**
     * name of this sort option
     */
    readonly name: keyof SortFunctions;
    /**
     * whether or not this option is enabled
     */
    enabled: boolean;
    /**
     * whether to sort in reverse
     */
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
    readonly sortBy: readonly SortOption[];
    mode: SortMode;
}

/**
 * The goal of the schedule evaluator is to efficiently sort the generated schedules
 * according to the set of the rules defined by the user
 */
class ScheduleEvaluator {
    /**
     * defines a number of sorting functions. By default, schedules are sorted in
     * **ascending** order according to the coefficient computed by one or a combination of sorting functions.
     */
    public static readonly sortFunctions = {
        /**
         * compute the variance of class times during the week
         *
         * returns a higher value when the class times are unbalanced
         */
        variance(this: ScheduleEvaluator, schedule: CmpSchedule) {
            const blocks = schedule.blocks;
            let sum = 0;
            let sumSq = 0;
            for (let i = 0; i < 7; i++) {
                const end = blocks[i + 1];
                let classTime = 0;
                for (let j = blocks[i]; j < end; j += 3) {
                    classTime += blocks[j + 1] - blocks[j];
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
        compactness(this: ScheduleEvaluator, schedule: CmpSchedule) {
            const blocks = schedule.blocks;
            let compact = 0;
            for (let i = 0; i < 7; i++) {
                const end = blocks[i + 1] - 5;
                for (let j = blocks[i]; j < end; j += 3) {
                    compact += blocks[j + 3] - blocks[j + 1];
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
        lunchTime(this: ScheduleEvaluator, schedule: CmpSchedule) {
            // 11:00 to 14:00
            const blocks = schedule.blocks;
            let totalOverlap = 0;
            for (let i = 0; i < 7; i++) {
                const end = blocks[i + 1];
                let dayOverlap = 0;
                for (let j = blocks[i]; j < end; j += 3) {
                    // 11:00 to 14:00
                    dayOverlap += Math.max(calcOverlap(660, 840, blocks[j], blocks[j + 1]), 0);
                }

                if (dayOverlap > 60) totalOverlap += dayOverlap;
            }
            return totalOverlap;
        },

        /**
         * calculate the time between the start time of the earliest class and 22:00
         *
         * For a schedule that has earlier classes, this method will return a higher number
         */
        noEarly(this: ScheduleEvaluator, schedule: CmpSchedule) {
            const blocks = schedule.blocks;
            const refTime = 12 * 60;
            let total = 0;
            for (let i = 0; i < 7; i++) {
                const start = blocks[i],
                    end = blocks[i + 1];
                if (end > start) {
                    const time = blocks[start];
                    total += Math.max(refTime - time, 0) ** 2;
                }
            }
            return total;
        },

        /**
         * compute the sum of walking distances between each consecutive pair of classes
         */
        distance(this: ScheduleEvaluator, schedule: CmpSchedule) {
            const timeMatrix = this.timeMatrix;

            // timeMatrix is actually a flattened matrix, so matrix[i][j] = matrix[i*len+j]
            const len = timeMatrix.length ** 0.5;
            const blocks = schedule.blocks;
            let dist = 0;
            for (let i = 0; i < 7; i++) {
                const end = blocks[i + 1] - 5;
                for (let j = blocks[i]; j < end; j += 3) {
                    // does not count the distance of the gap between two classes is greater than 45 minutes
                    if (blocks[j + 3] - blocks[j + 1] < 45) {
                        const r1 = blocks[j + 2],
                            r2 = blocks[j + 5];

                        // skip unknown buildings
                        if (r1 !== -1 && r2 !== -1) dist += timeMatrix[r1 * len + r2];
                    }
                }
            }
            return dist;
        },

        /**
         * need optimization (e.g. sort schedule and similarity schedule at first)
         */
        similarity(this: ScheduleEvaluator, schedule: CmpSchedule) {
            const sim = window.similaritySchedule;
            const cmp = schedule.schedule;
            let sum = 0;
            for (const c of cmp) {
                const st = sim[c[0]];
                if (st) {
                    for (const i of c[1]) {
                        if ((st as Set<number>).has(i)) {
                            sum++;
                        }
                    }
                }
            }
            return -1 * sum;
        },

        /**
         * the return value is not used. If this sort option is enabled, `shuffle` is called.
         */
        IamFeelingLucky() {
            return Math.random();
        }
    };
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
     * the dictionary of sort functions with `this` bind to the evaluator instance
     */
    public sortFunctions: SortFunctions;

    /**
     * the cache of coefficient array for each evaluating function
     */
    public sortCoeffCache: { [x in keyof SortFunctions]?: Float32Array } = {};

    /**
     * @param options
     * @param events the array of events kept, use to construct generated schedules
     */
    constructor(
        public options: Readonly<EvaluatorOptions>,
        public timeMatrix: Readonly<Int32Array>,
        public events: Event[] = []
    ) {
        const funcs: any = {};

        for (const [key, func] of Object.entries(ScheduleEvaluator.sortFunctions))
            funcs[key] = func.bind(this);
        this.sortFunctions = funcs;
    }

    /**
     * Add a schedule to the collection of results.
     * Group the time blocks and sort them in order.
     *
     * @requires optimization
     * @remarks insertion sort is used as there are not many elements in each day array.
     */
    public add(schedule: RawAlgoSchedule) {
        // calculate the total number of elements in the TimeArray we need to allocate
        let total = 8;
        for (const course of schedule) total += course[2].length - 8;
        const blocks = new Int16Array(total);
        blocks[7] = total;

        total = 8;
        for (let i = 0; i < 7; i++) {
            // start of the current day
            const s1 = (blocks[i] = total);
            for (const course of schedule) {
                const arr2 = course[2];
                const e2 = arr2[i + 1];
                // insertion sort
                for (let j = arr2[i]; j < e2; j += 3, total += 3) {
                    let k = s1;
                    const vToBeInserted = arr2[j];
                    for (; k < total; k += 3) {
                        if (vToBeInserted < blocks[k]) break;
                    }
                    // move elements 3 slots toward the end
                    blocks.copyWithin(k + 3, k, total);
                    // insert three elements
                    blocks[k] = vToBeInserted;
                    blocks[k + 1] = arr2[j + 1];
                    blocks[k + 2] = arr2[j + 2];
                }
            }
        }

        this._schedules.push({
            schedule,
            blocks,
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
     * @requires optimization
     * @param funcName the name of the sorting option
     * @param assign whether assign to the `coeff` field of each `CmpSchedule`
     * @returns the computed/cached array of coefficients
     */
    public computeCoeffFor(funcName: keyof SortFunctions, assign: boolean): Float32Array {
        const schedules = this._schedules;
        const len = schedules.length;
        const cache = this.sortCoeffCache[funcName];
        if (cache) {
            if (assign) for (let i = 0; i < len; i++) schedules[i].coeff = cache[i];
            return cache;
        } else {
            console.time(funcName);

            const evalFunc = this.sortFunctions[funcName];
            const newCache = new Float32Array(len);
            if (assign) {
                for (let i = 0; i < len; i++) {
                    const cmpSchedule = schedules[i];
                    const val = evalFunc(cmpSchedule);
                    newCache[i] = schedules[i].coeff = val;
                }
            } else {
                for (let i = 0; i < len; i++) {
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
     * @requires optimization
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

            for (let i = 0; i < len; i++) schedules[i].coeff = coeffs[i];
            console.timeEnd('normalizing coefficients');
        }
    }

    /**
     * count the number of sort options enabled.
     * @returns [number of sort options enabled, the index of the last enabled sort option]
     */
    public countSortOpt(): [number, number] {
        let count = 0;
        let lastIdx = -1;
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
     * sort the array of schedules according to their quality coefficients which will be computed by `computeCoeff`
     * @param opt.newOptions: pass in new sort options to override the current options
     * @param opt.quick quick mode: use Floyd–Rivest algorithm to select first
     * 100 elements and then sort only these elements.
     * @param opt.quickThresh Automatically enable quick mode if the length of schedules is greater than `quickThresh`
     * @requires optimization
     * @see {@link https://en.wikipedia.org/wiki/Floyd%E2%80%93Rivest_algorithm}
     */
    public sort({
        newOptions,
        quick = true,
        quickThresh = 10000
    }: {
        newOptions?: EvaluatorOptions;
        quick?: boolean;
        quickThresh?: number;
    } = {}) {
        if (newOptions) this.options = newOptions;
        this.computeCoeff();

        console.time('sorting: ');
        const schedules = this._schedules.slice();
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
            const ifReverse = new Float32Array(len).map((_, i) => (options[i].reverse ? -1 : 1));
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
        const len = arr.length;

        // no point to use quick sort if num of elements to be selected is greater than half of the length
        if (num >= len / 2) {
            arr.sort(compare);
        } else {
            quickselect(arr, num, 0, len - 1, compare);
            const slc = arr.slice(0, num).sort(compare);
            for (let i = 0; i < num; i++) arr[i] = slc[i];
        }
    }

    public size() {
        return this._schedules.length;
    }

    /**
     * Get a `Schedule` object at idx
     */
    public getSchedule(idx: number) {
        return new Schedule(this.schedules[idx].schedule, this.events);
    }
    /**
     * whether this evaluator contains an empty array of schedules
     */
    public empty() {
        return this._schedules.length === 0;
    }

    public clear() {
        this.schedules = [];
        this._schedules = [];
        this.sortCoeffCache = {};
        this.events = [];
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
