// @ts-check
import Schedule from '../models/Schedule';
/**
 * @typedef {{schedule: import("./ScheduleGenerator").RawSchedule, coeff: number}} ComparableSchedule
 */
class ScheduleEvaluator {
    /**
     * calculate the population variance
     * @param {number[]} args
     */
    static var(args) {
        let sum = 0;
        let sumSq = 0;
        for (let i = 0; i < args.length; i++) {
            sum += args[i];
            sumSq += args[i] ** 2;
        }
        return sumSq ** 2 / (args.length - 1) - (sum / args.length) ** 2;
    }

    /**
     * compute the variance of the days
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
        return ScheduleEvaluator.var(minutes);
    }

    /**
     * compute the compactness of a schedule
     * @param {RawSchedule} schedule
     */
    static compactness(schedule) {
        const groups = ScheduleEvaluator.groupCourses(schedule);
        let dist = 0;
        for (const group of groups) {
            for (let i = 0; i < group.length - 1; i++) {
                // start time of next class minus end time of previous class
                dist += group[i + 1][2][0] - group[i][2][1];
            }
        }
        return dist;
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
         *
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
     * @param {string} sortBy
     */
    constructor(sortBy) {
        /**
         * @type {ComparableSchedule[]}
         */
        this.schedules = [];
        this.sortBy = sortBy;
        // console.log(sortBy);
        // console.log(this.evalFunc);
        if (typeof ScheduleEvaluator[sortBy] !== 'function') throw 'Non-existent sorting option';
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
        const evalFunc = ScheduleEvaluator[this.sortBy];
        this.schedules.push({
            schedule: schedule,
            coeff: evalFunc(schedule)
        });
    }

    /**
     * sort the array of schedules according to their quality coefficients
     */
    sort() {
        // if want to be really fast, use Floyd–Rivest algorithm to select first, say, 100 elements and then sort only these elements
        this.schedules.sort((a, b) => a.coeff - b.coeff);
    }

    /**
     * change the sorting method and optionally do sorting
     * @param {string} sortBy
     * @param {boolean} doSort
     */
    changeSort(sortBy, doSort = true) {
        const evalFunc = ScheduleEvaluator[sortBy];
        if (typeof ScheduleEvaluator[sortBy] !== 'function') throw 'Non-existent sorting option';
        for (const cmpSchedule of this.schedules) {
            cmpSchedule.coeff = evalFunc(cmpSchedule.schedule);
        }
        if (doSort) this.sort();
        console.log(this.schedules[0]);
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
