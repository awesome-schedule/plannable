// @ts-check
import Schedule from '../models/Schedule';
// eslint-disable-next-line
import ScheduleGenerator from './ScheduleGenerator';
/**
 * @typedef {{schedule: import("./ScheduleGenerator").RawSchedule, coeff: number}} ComparableSchedule
 */
class ScheduleEvaluator {
    static optionDefaults = {
        sortBy: {
            variance: true,
            compactness: false,
            lunchTime: false,
            IamFeelingLucky: false
        },
        reverseSort: false
    };
    /**
     * calculate the population variance
     * @param {number[]} args
     */
    static std(args) {
        let sum = 0;
        let sumSq = 0;
        for (let i = 0; i < args.length; i++) {
            sum += args[i];
            // sumSq += args[i] ** 2;
        }
        const mean = sum / args.length;
        for (let i = 0; i < args.length; i++) {
            sumSq += Math.abs(args[i] - mean);
        }
        return sumSq;
    }

    /**
     * compute the standard deviation of class times
     * @param {import("./ScheduleGenerator").RawSchedule} schedule
     */
    static variance(schedule) {
        const minutes = new Array(5).fill(0);
        const days = ScheduleEvaluator.days;
        for (const course of schedule) {
            for (let i = 0; i < days.length; i++) {
                if (course[1].includes(days[i])) minutes[i] += course[2][1] - course[2][0];
            }
        }
        return ScheduleEvaluator.std(minutes);
    }

    /**
     * compute the compactness of a schedule
     * @param {import("./ScheduleGenerator").RawSchedule} schedule
     */
    static compactness(schedule) {
        const groups = ScheduleEvaluator.groupCourses(schedule);
        let dist = 0;
        for (const group of groups) {
            for (let i = 0; i < group.length - 1; i++) {
                // start time of next class minus end1 time of previous class
                dist += group[i + 1][2][0] - group[i][2][1];
            }
        }
        return dist;
    }

    static IamFeelingLucky() {
        return Math.random();
    }

    /**
     *
     * @param {number} a
     * @param {number} b
     * @param {number} c
     * @param {number} d
     */
    static calcOverlap(a, b, c, d) {
        if (a <= c && d <= b) return d - c;
        if (a <= c && c <= b) return b - c;
        else if (a <= d && d <= b) return d - a;
        else if (a >= c && b <= d) return b - a;
        else return 0;
    }

    /**
     * compute the lunch time of a schedule
     * @param {import("./ScheduleGenerator").RawSchedule} schedule
     */
    static lunchTime(schedule) {
        // 11:00 to 14:00
        const lunchStart = 11 * 60,
            lunchEnd = 14 * 60;
        let overlap = 0;
        for (const course of schedule) {
            overlap += ScheduleEvaluator.calcOverlap(
                lunchStart,
                lunchEnd,
                course[2][0],
                course[2][1]
            );
        }
        return overlap;
    }

    /**
     *
     * @param {import("./ScheduleGenerator").RawSchedule} schedule
     */
    static groupCourses(schedule) {
        /**
         * @type {import("./ScheduleGenerator").RawSchedule[]}
         */
        const groups = [];
        const days = ScheduleEvaluator.days;
        for (let i = 0; i < days.length; i++) groups.push([]);
        for (const course of schedule) {
            for (let i = 0; i < days.length; i++) {
                if (course[1].includes(days[i])) groups[i].push(course);
            }
        }
        /**
         * Sort according to their start time
         * @param {import("./ScheduleGenerator").RawCourse} s1
         * @param {import("./ScheduleGenerator").RawCourse} s2
         */
        const comparator = (s1, s2) => s1[2][0] - s2[2][0];
        for (const group of groups) {
            group.sort(comparator);
        }
        return groups;
    }

    static days = ['Mo', 'Tu', 'We', 'Th', 'Fr'];

    /**
     *
     * @param {import('./ScheduleGenerator').SortOptions} options
     */
    static validateOptions(options) {
        if (!options) return ScheduleEvaluator.optionDefaults;
        for (const key in options.sortBy) {
            if (typeof ScheduleEvaluator[key] !== 'function') throw 'Non-existent sorting option';
        }
        return options;
    }

    /**
     *
     * @param {import('./ScheduleGenerator').SortOptions} options
     */
    constructor(options) {
        /**
         * @type {ComparableSchedule[]}
         */
        this.schedules = [];
        this.options = ScheduleEvaluator.validateOptions(options);
    }

    /**
     * Add a schedule to the collection of results. Compute its coefficient of quality.
     * @param {import("./ScheduleGenerator").RawSchedule} timeTable
     */
    add(timeTable) {
        /**
         * Use variance to evaluate the class
         */
        const schedule = timeTable.concat();
        this.schedules.push({
            schedule: schedule,
            coeff: 0
        });
    }

    computeCoeff() {
        if (this.options.sortBy.IamFeelingLucky) {
            for (const cmpSchedule of this.schedules) {
                cmpSchedule.coeff = Math.random();
            }
            return;
        }
        console.time('normalizing coefficients');
        const coeffs = [];
        for (const key in this.options.sortBy) {
            if (this.options.sortBy[key]) {
                const coeff = [];
                const evalFunc = ScheduleEvaluator[key];
                let max = 0;
                for (const cmpSchedule of this.schedules) {
                    const val = evalFunc(cmpSchedule.schedule);
                    if (val > max) max = val;
                    coeff.push(val);
                }
                const normalizeRatio = max / 100;
                coeffs.push(coeff.map(v => v / normalizeRatio));
            }
        }
        // console.log(coeffs);
        for (let i = 0; i < coeffs[0].length; i++) {
            let sum = 0;
            for (let j = 0; j < coeffs.length; j++) {
                sum += coeffs[j][i] ** 2;
            }
            this.schedules[i].coeff = Math.sqrt(sum);
        }
        console.timeEnd('normalizing coefficients');
    }

    /**
     * sort the array of schedules according to their quality coefficients computed using the given
     */
    sort() {
        // if want to be really fast, use Floyd–Rivest algorithm to select first, say, 100 elements and then sort only these elements
        let cmpFunc;
        if (this.options.reverseSort) cmpFunc = (a, b) => b.coeff - a.coeff;
        else cmpFunc = (a, b) => a.coeff - b.coeff;
        this.schedules.sort(cmpFunc);
    }

    /**
     * change the sorting method and (optionally) do sorting
     * @param {import('./ScheduleGenerator').SortOptions} options
     */
    changeSort(options, doSort = true) {
        console.time('change sort');
        this.options = ScheduleEvaluator.validateOptions(options);
        this.computeCoeff();
        if (doSort) this.sort();
        console.timeEnd('change sort');
    }

    size() {
        return this.schedules.length;
    }

    /**
     * @param {number} idx
     */
    getRaw(idx) {
        /**
         * @type {import('../models/Schedule').RawSchedule}
         */
        const raw_schedule = [];
        for (const raw_course of this.schedules[idx].schedule) {
            raw_schedule.push([raw_course[0], raw_course[3], -1]);
        }
        return raw_schedule;
    }
    /**
     * Get a `Schedule` object at idx
     * @param {number} idx
     */
    getSchedule(idx) {
        return new Schedule(this.getRaw(idx), 'Schedule', idx + 1);
    }
    /**
     * whether this evaluator contains an empty array of schedules
     * @returns {boolean}
     */
    empty() {
        return this.schedules.length === 0;
    }

    clear() {
        this.schedules = [];
    }
}
export default ScheduleEvaluator;
