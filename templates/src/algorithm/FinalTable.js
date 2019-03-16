import Schedule from '../models/Schedule';
import * as math from 'mathjs';
import Heap from 'heap-js';
class FinalTable {
    constructor() {
        this.finalTable = new Heap(function(a, b) {
            return a[a.length - 1] - b[b.length - 1];
        });
    }

    /**
     *
     * @param {[string,string[],number[],number]} timeTable
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
        const stdev = math.std(mo, tu, we, th, fr);

        timeTable = timeTable.concat(stdev);

        this.finalTable.push(timeTable);
    }
}
export { FinalTable };
