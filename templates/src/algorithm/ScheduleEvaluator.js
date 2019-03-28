// @ts-check
/**
 * @typedef {{schedule: import("./ScheduleGenerator").RawSchedule, coeff: number}} ComparableSchedule
 */
class ScheduleEvaluator {
    /**
     * calculate the population variance
     * @param {number[]} args
     */
    static variance(args) {
        let sum = 0;
        let sumSq = 0;
        for (let i = 0; i < args.length; i++) {
            sum += args[i];
            sumSq += args[i] ** 2;
        }
        return sumSq ** 2 / (args.length - 1) - (sum / args.length) ** 2;
    }
    constructor() {
        /**
         * @type {ComparableSchedule[]}
         */
        this.schedules = [];
    }

    /**
     * Add a schedule to the collection of results. Compute its coefficient of quality.
     * @param {import("./ScheduleGenerator").RawSchedule} timeTable
     */
    add(timeTable) {
        /**
         * Use standard deviation to evaluate the class
         */
        let mo = 0;
        let tu = 0;
        let we = 0;
        let th = 0;
        let fr = 0;
        for (const course of timeTable) {
            const minutes = course[2][1] - course[2][0];
            if (course[1].indexOf('Mo') !== -1) {
                mo += minutes;
            }
            if (course[1].indexOf('Tu') !== -1) {
                tu += minutes;
            }
            if (course[1].indexOf('We') !== -1) {
                we += minutes;
            }
            if (course[1].indexOf('Th') !== -1) {
                th += minutes;
            }
            if (course[1].indexOf('Fr') !== -1) {
                fr += minutes;
            }
        }

        this.schedules.push({
            schedule: timeTable.concat(),
            coeff: ScheduleEvaluator.variance([mo, tu, we, th, fr])
        });
    }

    sort() {
        this.schedules.sort((a, b) => a.coeff - b.coeff);
    }
}
export { ScheduleEvaluator };
