/**
 * @module algorithm
 * @author Hanzhi Zhou
 */

/**
 *
 */
import quickselect from 'quickselect';
import Event from '../models/Event';
import { ScheduleAll } from '../models/Schedule';
import GeneratedSchedule from '../models/GeneratedSchedule';
import { calcOverlap } from '../utils';
import { RawAlgoCourse, TimeArray } from './ScheduleGenerator';

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
    weight: number;
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
        variance(blocks: Readonly<TimeArray>, offset: number) {
            let sum = 0,
                sumSq = 0;
            const oEnd = offset + 7;
            for (let i = offset; i < oEnd; i++) {
                const end = offset + blocks[i + 1];
                let classTime = 0;
                for (let j = blocks[i] + offset; j < end; j += 3) {
                    classTime += blocks[j + 1] - blocks[j];
                }
                sum += classTime;
                sumSq += classTime * classTime;
            }
            return sumSq / 5 - (sum / 5) ** 2;
        },

        /**
         * compute the vertical compactness of a schedule,
         * defined as the total time in between each pair of consecutive classes
         *
         * The greater the time gap between classes, the greater the return value will be
         */
        compactness(blocks: Readonly<TimeArray>, offset: number) {
            let compact = 0;
            const oEnd = offset + 7;
            for (let i = offset; i < oEnd; i++) {
                const end = offset + blocks[i + 1] - 5;
                for (let j = blocks[i] + offset; j < end; j += 3) {
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
        lunchTime(blocks: Readonly<TimeArray>, offset: number) {
            // 11:00 to 14:00
            let totalOverlap = 0;
            const oEnd = offset + 7;
            for (let i = offset; i < oEnd; i++) {
                const end = blocks[i + 1] + offset;
                let dayOverlap = 0;
                for (let j = blocks[i] + offset; j < end; j += 3) {
                    // 11:00 to 14:00
                    dayOverlap += calcOverlap(660, 840, blocks[j], blocks[j + 1]);
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
        noEarly(blocks: Readonly<TimeArray>, offset: number) {
            const refTime = 12 * 60,
                oEnd = offset + 7;
            let total = 0;
            for (let i = offset; i < oEnd; i++) {
                const start = blocks[i],
                    end = blocks[i + 1];
                if (end > start) {
                    // if this day is not empty
                    const time = blocks[start + offset];
                    total += Math.max(refTime - time, 0) ** 2;
                }
            }
            return total;
        },

        /**
         * compute the sum of walking distances between each consecutive pair of classes
         */
        distance(
            timeMatrix: Readonly<Int32Array>,
            blocks: Readonly<TimeArray>,
            offset: number,
            threshold: number
        ) {
            // timeMatrix is actually a flattened matrix, so matrix[i][j] = matrix[i*len+j]
            const len = timeMatrix.length ** 0.5,
                oEnd = offset + 7;
            let dist = 0;
            for (let i = offset; i < oEnd; i++) {
                const end = blocks[i + 1] + offset - 5;
                for (let j = blocks[i] + offset; j < end; j += 3) {
                    // does not count the distance of the gap between two classes is greater than 45 minutes
                    if (blocks[j + 3] - blocks[j + 1] < threshold) {
                        const r1 = blocks[j + 2],
                            r2 = blocks[j + 5];

                        // skip unknown buildings
                        if (r1 !== -1 && r2 !== -1) dist += timeMatrix[r1 * len + r2];
                    }
                }
            }
            return dist;
        },

        similarity(this: ScheduleEvaluator, start: number) {
            const sim = this.refSchedule,
                classList = this.classList,
                allChoices = this.allChoices;
            const numCourses = classList.length;
            let sum = 0;
            start *= numCourses;
            for (let j = 0; j < numCourses; j++) {
                const course = classList[j][allChoices[start + j]];
                const key = sim[course[0]];
                if (key) {
                    for (const sid of course[1]) {
                        if ((key as Set<number>).has(sid)) sum++;
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
     * the cache of [coefficient array, max, min] for each sort function
     */
    public sortCoeffCache: {
        [x in keyof SortFunctions]?: readonly [Float32Array, number, number];
    } = {};
    /**
     * the indices of the sorted schedules
     */
    public indices: Uint32Array;
    /**
     * the coefficient array used when performing a sort
     */
    private coeffs: Float32Array;
    /**
     * the cumulative length of the time arrays for each schedule.
     * `this.offsets[i]` is the start index of the time array of schedule `i` in `this.blocks`
     */
    private offsets: Readonly<Uint32Array>;
    /**
     * array of [[TimeArray]]s concatenated together
     */
    private blocks: Readonly<Int16Array>;
    /**
     * the underlying buffer for the typed arrays above, except `sortCoeffCache`
     */
    private buf: ArrayBuffer;

    /**
     * @param options
     * @param timeMatrix see [[Window.timeMatrix]]
     * @param events the array of events kept, use to construct generated schedules
     * @param classList the 2d array of (combined) sections
     * @param allChoices array of `currentChoices` (see [[ScheduleGenerator.computeSchedules]])
     * concatenated together
     * @param refSchedule the reference schedule used by the
     * [[ScheduleEvaluator.sortFunctions.similarity]] sort function
     * @param timeArrays the time arrays constructed by [[timeArrayToCompact]]
     * @param count the number of schedules in total
     * @param timeLen see the return value of [[ScheduleGenerator.computeSchedules]]
     */
    constructor(
        public options: Readonly<EvaluatorOptions> = { sortBy: [], mode: 0 },
        public readonly timeMatrix: Readonly<Int32Array> = new Int32Array(),
        public readonly events: Event[] = [],
        public readonly classList: RawAlgoCourse[][] = [],
        public readonly allChoices: Readonly<Uint8Array> = new Uint8Array(),
        public refSchedule: ScheduleAll = {},
        readonly timeArrays: Readonly<Int32Array> = new Int32Array(),
        count = 0,
        timeLen = 0
    ) {
        {
            // note: timeLen is typically about 50*count, which takes the most space
            // previous three arrays are 32-bit typed arrays, so no byte alignment is needed
            this.buf = new ArrayBuffer(count * 4 * 3 + timeLen * 2);
            const indices = (this.indices = new Uint32Array(this.buf, 0, count));
            for (let i = 0; i < count; i++) indices[i] = i;
            this.coeffs = new Float32Array(this.buf, count * 4, count);
        }

        const offsets = (this.offsets = new Uint32Array(this.buf, count * 8, count));
        const blocks = (this.blocks = new Int16Array(this.buf, count * 12));

        const numCourses = classList.length;
        let offset = 0;
        for (let i = 0; i < count; i++) {
            // record the current offset
            offsets[i] = offset;

            // sort the time blocks in order
            const start = i * numCourses;
            let bound = 8; // size does not contain offset
            // no offset in j because arr2 also needs it
            for (let j = 0; j < 7; j++) {
                // start of the current day
                const s1 = (blocks[j + offset] = bound);
                for (let k = 0; k < numCourses; k++) {
                    // offset of the time arrays
                    const arrOffset = timeArrays[allChoices[start + k] * numCourses + k];
                    const e2 = timeArrays[arrOffset + j + 1];
                    // insertion sort, fast for small arrays
                    for (let n = timeArrays[arrOffset + j]; n < e2; n += 3, bound += 3) {
                        // p already contains offset
                        let p = s1 + offset;
                        const vToBeInserted = timeArrays[n],
                            realBound = bound + offset; // the end of the current array
                        for (; p < realBound; p += 3) {
                            if (vToBeInserted < blocks[p]) break;
                        }
                        // move elements 3 slots toward the end
                        // same as `blocks.copyWithin(p + 3, p, realBound);`, but faster
                        for (let m = realBound - 1; m >= p; m--) blocks[m + 3] = blocks[m];
                        // insert three elements at p
                        blocks[p] = vToBeInserted;
                        blocks[p + 1] = timeArrays[n + 1];
                        blocks[p + 2] = timeArrays[n + 2];
                    }
                }
            }
            offset += blocks[offset + 7] = bound;
        }
    }

    get size() {
        return this.coeffs.length;
    }

    /**
     * whether the random sort option is enabled
     */
    public isRandom() {
        return this.options.sortBy.some(x => x.name === 'IamFeelingLucky' && x.enabled);
    }

    /**
     * compute the coefficient array for a specific sorting option.
     * if it exists (i.e. already computed), don't do anything
     *
     * @requires optimization
     * @param funcName the name of the sorting option
     * @param assign whether assign to the values to `this.coeffs`
     * @returns the computed/cached array of coefficients
     */
    public computeCoeffFor(funcName: keyof SortFunctions, assign: boolean) {
        const len = this.size;
        const cache = this.sortCoeffCache[funcName];
        if (cache) {
            if (assign) this.coeffs.set(cache[0]);
            return cache;
        } else {
            console.time(funcName);
            const newCache = new Float32Array(len);
            const blocks = this.blocks,
                offsets = this.offsets;
            let max = -Infinity,
                min = Infinity;
            if (funcName === 'similarity') {
                const evalFunc = ScheduleEvaluator.sortFunctions.similarity.bind(this);
                for (let i = 0; i < len; i++) {
                    const val = (newCache[i] = evalFunc(i));
                    if (val > max) max = val;
                    if (val < min) min = val;
                }
            } else if (funcName === 'distance') {
                const thresh = 45;
                const evalFunc = ScheduleEvaluator.sortFunctions.distance;
                const timeMatrix = this.timeMatrix;
                for (let i = 0; i < len; i++) {
                    const val = (newCache[i] = evalFunc(timeMatrix, blocks, offsets[i], thresh));
                    if (val > max) max = val;
                    if (val < min) min = val;
                }
            } else {
                const evalFunc = ScheduleEvaluator.sortFunctions[funcName];
                for (let i = 0; i < len; i++) {
                    const val = (newCache[i] = evalFunc(blocks, offsets[i]));
                    if (val > max) max = val;
                    if (val < min) min = val;
                }
            }
            if (assign) this.coeffs.set(newCache);
            console.timeEnd(funcName);
            return (this.sortCoeffCache[funcName] = [newCache, max, min] as const);
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
            const len = this.size;
            const coeffs = this.coeffs.fill(0);

            // finding the minimum and maximum is quite fast for 1e6 elements, so not cached.
            for (const option of options) {
                const [coeff, max, min] = this.computeCoeffFor(option.name, false);

                const range = max - min;
                // if all of the values are the same, skip this sorting coefficient
                if (!range) {
                    console.warn(range, option.name);
                    continue;
                }

                const normalizeRatio = 64 / range,
                    weight = option.weight || 1;

                // use Euclidean distance to combine multiple sorting coefficients
                if (option.reverse) {
                    for (let i = 0; i < len; i++) {
                        const val = (max - coeff[i]) * normalizeRatio;
                        coeffs[i] += weight * val * val;
                    }
                } else {
                    for (let i = 0; i < len; i++) {
                        const val = (coeff[i] - min) * normalizeRatio;
                        coeffs[i] += weight * val * val;
                    }
                }
            }
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
        quick = false,
        quickThresh = 10000
    }: {
        newOptions?: EvaluatorOptions;
        quick?: boolean;
        quickThresh?: number;
    } = {}) {
        if (newOptions) this.options = newOptions;
        this.computeCoeff();

        console.time('sorting: ');

        // reset indices
        const _size = this.size;
        const _indices = this.indices;
        for (let i = 0; i < _size; i++) _indices[i] = i;

        if (this.isRandom()) {
            this.shuffle(this.indices);
            console.timeEnd('sorting: ');
            return;
        }

        const options = this.options.sortBy.filter(x => x.enabled);
        const isCombined = this.options.mode === SortMode.combined;

        /**
         * The comparator function used:
         *
         * if only one option is enabled, the sort direction depends on the `reversed` property of it
         *
         * if multiple sort options are enabled and the sort mode is combined, which means
         * `(!isCombined || options.length === 1)` is false, the `computeCoeff` method
         * is already taken care of the sort direction of each function, so we sort in ascending order anyway
         */
        const coeffs = this.coeffs;
        const cmpFunc: (a: number, b: number) => number =
            options[0].reverse && (!isCombined || options.length === 1)
                ? (a, b) => coeffs[b] - coeffs[a] // descending
                : (a, b) => coeffs[a] - coeffs[b]; // ascending

        if (isCombined || options.length === 1) {
            if (quick || this.size > quickThresh) {
                this.partialSort(this.indices, cmpFunc, 1000);
            } else {
                this.indices.sort(cmpFunc);
            }
        } else {
            const len = options.length;

            // if option[i] is reverse, ifReverse[i] will be -1 * weight
            const ifReverse = new Float32Array(len).map((_, i) => (options[i].reverse ? -1 : 1));
            // cached array of coefficients for each enabled sort function
            const fbCoeffs = options.map(x => this.sortCoeffCache[x.name]![0]);
            const func = (a: number, b: number) => {
                let r = 0;
                for (let i = 0; i < len; i++) {
                    const coeff = fbCoeffs[i];
                    // calculate the difference in coefficients
                    r = ifReverse[i] * (coeff[a] - coeff[b]);

                    // if non-zero, returns this coefficient
                    if (r) return r;

                    // otherwise, fallback to the next sort option
                }
                return r;
            };
            if (quick || this.size > quickThresh) {
                this.partialSort(this.indices, func, 1000);
            } else {
                this.indices.sort(func);
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
    public partialSort(arr: Uint32Array, compare: (x: number, y: number) => number, num: number) {
        const len = arr.length;

        // no point to use quick select if num of elements to be selected is greater than half of the length
        if (num >= len / 2) {
            arr.sort(compare);
        } else {
            quickselect(arr, num, 0, len - 1, compare);
            const slc = arr.slice(0, num).sort(compare);
            for (let i = 0; i < num; i++) arr[i] = slc[i];
        }
    }

    /**
     * Get a `Schedule` object at idx
     */
    public getSchedule(idx: number) {
        const numCourses = this.classList.length;
        idx = this.indices[idx] * numCourses;
        return new GeneratedSchedule(
            Array.from(this.allChoices.slice(idx, idx + numCourses)).map(
                (choice, classNum) => this.classList[classNum][choice]
            ),
            this.events
        );
    }
    /**
     * whether this evaluator contains an empty array of schedules
     */
    public empty() {
        return this.size === 0;
    }

    /**
     * Fisher–Yates shuffle algorithm
     * @see https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle
     */
    private shuffle(a: Uint32Array) {
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
