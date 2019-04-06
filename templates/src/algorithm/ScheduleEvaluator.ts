import Schedule from '../models/Schedule';
import { RawAlgoSchedule, RawAlgoCourse } from './ScheduleGenerator';

export enum SortMode {
    fallback = 0,
    combined = 1
}

export type SortModes = Array<{
    mode: SortMode;
    title: string;
    description: string;
}>;

interface CmpSchedules {
    schedule: RawAlgoSchedule;
    coeff: number;
}

interface MultiCriteriaCmpSchedules {
    schedule: RawAlgoSchedule;
    coeff: Float32Array;
}

export interface SortOptions {
    sortBy: Array<{
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
    }>;
    mode: SortMode;
}

class ScheduleEvaluator {
    public static readonly days = ['Mo', 'Tu', 'We', 'Th', 'Fr'];

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
        mode: SortMode.combined
    };

    public static readonly sortModes: SortModes = [
        {
            mode: SortMode.combined,
            title: 'Combined',
            description: 'Combine all sorting options and given them equal weight'
        },
        {
            mode: SortMode.fallback,
            title: 'Fallback',
            description:
                'Sort using the options on top first. If compare equal, sort using the next option.'
        }
    ];

    public static sortFunctions: { [x: string]: (schedule: RawAlgoSchedule) => number } = {
        /**
         * compute the standard deviation of class times
         */
        variance(schedule: RawAlgoSchedule) {
            const minutes = new Float32Array(5);
            const days = ScheduleEvaluator.days;
            for (const course of schedule) {
                for (let i = 0; i < days.length; i++) {
                    const timeBlock = course[1][days[i]];
                    if (timeBlock) {
                        minutes[i] += timeBlock[1] - timeBlock[0];
                    }
                }
            }
            return ScheduleEvaluator.std(minutes);
        },

        /**
         * compute the vertical compactness of a schedule,
         * defined as the total time in between each pair of consecutive classes
         */
        compactness(schedule: RawAlgoSchedule) {
            const DAYS = ScheduleEvaluator.days;
            const week: number[][] = [[], [], [], [], []];
            for (const c of schedule) {
                const crs = c[1];
                for (let k = 0; k < 5; k++) {
                    const temp = week[k];
                    week[k].push.apply(temp, crs[DAYS[k]]);
                }
            }

            let compact: number = 0;

            for (const arr of week) {
                for (let i = 0; i < arr.length; i += 2) {
                    for (let j = i - 2; j >= 0; j -= 2) {
                        if (arr[j] > arr[j + 2]) {
                            const tempL = arr[j];
                            const tempR = arr[j + 1];
                            arr[j] = arr[j + 2];
                            arr[j + 1] = arr[j + 2 + 1];
                            arr[j + 2] = tempL;
                            arr[j + 2 + 1] = tempR;
                        } else {
                            break;
                        }
                    }
                }

                for (let i = 2; i < arr.length; i += 2) {
                    compact += arr[i] - arr[i - 1];
                }
            }

            return compact;
        },

        /**
         * compute overlap of the classes and the lunch time,
         * defined as the time between 11:00 and 14:00
         */
        lunchTime(schedule: RawAlgoSchedule) {
            // 11:00 to 14:00
            const lunchStart = 11 * 60;
            const lunchEnd = 14 * 60;
            const lunchDuration = lunchEnd - lunchStart;
            let overlap = 0;
            for (const course of schedule) {
                const tmp = course[1];
                for (const day in tmp) {
                    const blocks = tmp[day];
                    for (let i = 0; i < blocks.length; i += 2) {
                        const olap = ScheduleEvaluator.calcOverlap(
                            lunchStart,
                            lunchEnd,
                            blocks[i],
                            blocks[i + 1]
                        );
                        overlap += Math.exp(olap / lunchDuration / 4);
                    }
                }
            }
            return overlap;
        },

        noEarly(schedule: RawAlgoSchedule) {
            const earliest = new Int32Array(5).fill(24 * 60);
            const days = ScheduleEvaluator.days;
            const refTime = 8 * 60;
            for (const course of schedule) {
                for (let i = 0; i < 5; i++) {
                    const timeBlock = course[1][days[i]];
                    if (timeBlock) earliest[i] = Math.min(earliest[i], Math.min(...timeBlock));
                }
            }
            return earliest.reduce((acc, x) => acc + x - refTime, 0);
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

    /**
     * although it's called std, it is actually calculating the
     * sum of the absolute values of the difference between each sample and the mean
     */
    public static std(args: Float32Array) {
        let sum = 0;
        let sumSq = 0;
        for (let i = 0; i < args.length; i++) {
            sum += args[i];
        }
        const mean = sum / args.length;
        for (let i = 0; i < args.length; i++) {
            sumSq += Math.abs(args[i] - mean);
        }
        return sumSq;
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

    public schedules: CmpSchedules[] | MultiCriteriaCmpSchedules[];
    public options: SortOptions;

    constructor(options: SortOptions) {
        this.schedules = [];
        this.options = ScheduleEvaluator.validateOptions(options);
    }

    /**
     * Add a schedule to the collection of results. Compute its coefficient of quality.
     */
    public add(schedule: RawAlgoSchedule) {
        (this.schedules as CmpSchedules[]).push({
            schedule: schedule.concat(),
            coeff: 0
        });
    }

    public isRandom() {
        return this.options.sortBy.some(x => x.name === 'IamFeelingLucky' && x.enabled);
    }

    public computeCoeff() {
        if (this.isRandom()) return;

        const [count, lastIdx] = this.countSortOpt();
        if (this.options.mode === SortMode.fallback) {
            console.time('precomputing coefficients');
            // tslint:disable-next-line
            const schedules = this.schedules as MultiCriteriaCmpSchedules[];
            if (count === 1) {
                const evalFunc = ScheduleEvaluator.sortFunctions[this.options.sortBy[0].name];
                for (const cmpSchedule of this.schedules) {
                    cmpSchedule.coeff = evalFunc(cmpSchedule.schedule);
                }
            } else {
                const evalFuncs = this.options.sortBy
                    .filter(x => x.enabled)
                    .map(x => ScheduleEvaluator.sortFunctions[x.name]);
                const len = evalFuncs.length;
                const ef = evalFuncs[0];
                for (const schedule of schedules) {
                    const arr = new Float32Array(len);
                    arr[0] = ef(schedule.schedule);
                    schedule.coeff = arr;
                }
                for (let i = 1; i < evalFuncs.length; i++) {
                    const evalFunc = evalFuncs[i];
                    for (const schedule of schedules) {
                        schedule.coeff[i] = evalFunc(schedule.schedule);
                    }
                }
            }
            console.timeEnd('precomputing coefficients');
            return;
        }

        const schedules = this.schedules as CmpSchedules[];
        if (count === 1) {
            const option = this.options.sortBy[lastIdx];
            const evalFunc = ScheduleEvaluator.sortFunctions[option.name];
            for (const cmpSchedule of schedules) {
                cmpSchedule.coeff = evalFunc(cmpSchedule.schedule);
            }
            return;
        }

        console.time('normalizing coefficients');
        // note: fixed-size typed array is must faster than 'normal' array
        const coeffs = new Float32Array(schedules.length);
        for (const option of this.options.sortBy) {
            if (option.enabled) {
                const coeff = new Float32Array(schedules.length);
                const evalFunc = ScheduleEvaluator.sortFunctions[option.name];
                let max = 0,
                    min = Infinity;
                for (let i = 0; i < schedules.length; i++) {
                    const val = evalFunc(schedules[i].schedule);
                    if (val > max) max = val;
                    if (val < min) min = val;
                    coeff[i] = val;
                }
                const range = max - min;
                const normalizeRatio = range / 100;
                if (option.reverse) {
                    for (let i = 0; i < coeffs.length; i++) {
                        coeffs[i] += ((max - coeff[i]) / normalizeRatio) ** 2;
                    }
                } else {
                    for (let i = 0; i < coeffs.length; i++) {
                        coeffs[i] += ((coeff[i] - min) / normalizeRatio) ** 2;
                    }
                }
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
            this.shuffle(this.schedules as CmpSchedules[]);
            console.timeEnd('sorting: ');
            return;
        }

        const options = this.options.sortBy.filter(x => x.enabled);

        /**
         * The comparator function when there's only one sorting option selected
         */
        const cmpFunc: (a: CmpSchedules, b: CmpSchedules) => number = options[0].reverse
            ? (a, b) => b.coeff - a.coeff
            : (a, b) => a.coeff - b.coeff;
        if (this.options.mode === SortMode.combined) {
            // if want to be really fast, use Floyd–Rivest algorithm to select first,
            // say, 100 elements and then sort only these elements
            (this.schedules as CmpSchedules[]).sort(cmpFunc);
        } else {
            if (options.length === 1) (this.schedules as CmpSchedules[]).sort(cmpFunc);
            else {
                const evalFuncs = options.map(x => ScheduleEvaluator.sortFunctions[x.name]);
                const len = evalFuncs.length;
                const schedules = this.schedules as MultiCriteriaCmpSchedules[];
                const ifReverse = new Int8Array(len).map((_, i) => (options[i].reverse ? -1 : 1));
                schedules.sort((a, b) => {
                    const c1 = a.coeff;
                    const c2 = b.coeff;
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
        return new Schedule(this.schedules[idx].schedule, 'Schedule', idx + 1);
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
