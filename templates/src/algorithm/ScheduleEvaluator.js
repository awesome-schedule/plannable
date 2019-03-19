// @ts-check
import * as math from 'mathjs';
import Heap from 'heap-js';
/**
 * @typedef {{schedule: import("./ScheduleGenerator").RawSchedule, coeff: number}} ComparableSchedule
 */
class ScheduleEvaluator {
    constructor() {
        this.finalTable = new Heap(
            /**
             *
             * @param {ComparableSchedule} a
             * @param {ComparableSchedule} b
             */
            function(a, b) {
                return a.coeff - b.coeff;
            }
        );
    }

    /**
     *
     * @param {import("./ScheduleGenerator").RawSchedule} timeTable
     */
    add(timeTable) {
        /**
         * Use standard deviation to evaluate the class
         * Use heap to store the data
         */
        let mo = 0;
        let tu = 0;
        let we = 0;
        let th = 0;
        let fr = 0;
        for (const course of timeTable) {
            const minutes = course[2][1] - course[2][0];
            if (course[1].indexOf('Mo') != -1) {
                mo += minutes;
            }
            if (course[1].indexOf('Tu') != -1) {
                tu += minutes;
            }
            if (course[1].indexOf('We') != -1) {
                we += minutes;
            }
            if (course[1].indexOf('Th') != -1) {
                th += minutes;
            }
            if (course[1].indexOf('Fr') != -1) {
                fr += minutes;
            }
        }
        const stdev = math.std([mo, tu, we, th, fr]);

        this.finalTable.push({
            schedule: timeTable.concat(),
            coeff: stdev
        });
    }
}
export { ScheduleEvaluator };
