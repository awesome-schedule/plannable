import AllRecords from '../models/AllRecords';
import Schedule from '../models/Schedule';
import CourseRecord from '../models/CourseRecord';
import { FinalTable } from './FinalTable';

class ScheduleGenerator {
    /**
     *
     * @param {AllRecords} allRecords
     */
    constructor(allRecords) {
        this.allRecords = allRecords;
    }

    /**
     *
     * @param {Schedule} schedule
     * @param {Object<string, any>} filter
     */
    getSchedules(schedule, filter = { a: 0 }) {
        /**
         * The entrance of the schedule generator
         * Read from **schedule.All** and collect data from **allRecords**
         * Collect data from **section(index)[7]**
         * Parse the **days** into desired format: **{[ string[], number[] ]}**
         * e.g. [ ["Mo","Tu"],[600,650] ]
         * concatonate with the **key** and push into the **classList** to form a 3D array
         * e.g. [ [ ["span20205",["Mo","Tu"],[600,650]], ["span20205",["Th","Fr"],[720,770]] ],
         *        [ ["cs21105"  ,["Mo","We"],[400,450]], ["cs21105"  ,["We","Fr"],[900,975]] ] ]
         * Pass the **ClassList** into the **createSchedule** and return a **FinalTable** Object
         */
        const courses = schedule.All;
        const classList = [];
        for (const key in courses) {
            const classes = [];
            const info = this.allRecords.getRecord(key);
            const day = info.getRecord(courses[key]).days;
            for (const d of day) {
                const [date, timeBlock] = this.parseTime(d);
                classes.push([key, date, timeBlock]);
            }
            classList.push(classes);
        }
        const result = this.createSchedule(classList);
        return result;
    }

    /**
     *
     * @param {[string,string[],number[]]} classList
     * */
    createSchedule(classList) {
        /**
         * classList --> [keys,[days],[start,end]]
         * finatable --> [keys,[days],[start,end],index]
         */

        let classNum = 0;
        let choiceNum = 0;
        let pathMemory = Array.from({ length: classList.length }, (x, i) => 0);
        let timeTable = new Array();
        const finalTable = new FinalTable();
        let exhausted = false;
        while (true) {
            if (classNum >= classList.length) {
                finalTable.add(timeTable);
                classNum -= 1;
                choiceNum = pathMemory[classNum];
                timeTable.pop();
            }

            [classNum, choiceNum, pathMemory, timeTable, exhausted] = this.AlgorithmRetract(
                classList,
                classNum,
                choiceNum,
                pathMemory,
                timeTable
            );

            if (exhausted) {
                break;
            }

            const date = classList[classNum][choiceNum][1];
            const timeBlock = classList[classNum][choiceNum][2];

            if (!this.checkTimeConflict(timeTable, date, timeBlock)) {
                //if the schedule matches, record the next path memory and go to the next class, reset the choiceNum = 0
                timeTable.push(classList[classNum][choiceNum].concat(choiceNum));
                pathMemory[classNum] = choiceNum + 1;
                classNum += 1;
                choiceNum = 0;
            } else {
                choiceNum += 1;
            }
        }
        return finalTable;
    }

    /**
     *
     * @param {[string,string[],number[]]} classList
     * @param {number} classNum
     * @param {number} choiceNum
     * @param {number[]} pathMemory
     * @param {string,string[],number[],number} timeTable
     * */
    AlgorithmRetract(classList, classNum, choiceNum, pathMemory, timeTable) {
        /**
         * when all possibilities in on class have exhausted, retract one class
         * explore the next possibilities in the nearest possible class
         * reset the memory path forward to zero
         */

        while (choiceNum >= classList[classNum].length) {
            classNum -= 1;
            if (classNum < 0) {
                return [classNum, choiceNum, pathMemory, timeTable, true];
            }
            timeTable.pop();
            choiceNum = pathMemory[classNum];
            for (let i = classNum + 1; i < pathMemory.length; i++) {
                pathMemory[i] = 0;
            }
        }
        return [classNum, choiceNum, pathMemory, timeTable, false];
    }

    /**
     *
     * @param {string,string[],number[],number} timeTable
     * @param {string[]} date
     * @param {number[]} timeBlock
     * */
    checkTimeConflict(timeTable, date, timeBlock) {
        /*
        compare the new class to see if it has conflicts with the existing time table
        :param timeTable: three entries: 1. the class serial number, 2. the date 3. the time
        :param date: contains the date when the class takes place
        :param timeBlock: contains beginTime and endTime of a class
        :return: Boolean type: true if it has conflict, else false
        */
        if (date === 'None' || 'None' in timeBlock) {
            //do not include any TBA
            return true;
        }
        if (timeTable === []) {
            return false;
        }
        const beginTime = timeBlock[0];
        const endTime = timeBlock[1];
        for (const times of timeTable) {
            const dates = times[1];
            const begin = times[2][0];
            const end = times[2][1];
            for (const d of date) {
                if (!dates.includes(d)) {
                    continue;
                }
                if (
                    (begin <= beginTime && beginTime <= end) ||
                    (begin <= endTime && endTime <= end)
                ) {
                    return true;
                }
            }
        }
        return false;
    }

    /**
     *
     * @param {string} classTime
     */
    parseTime(classTime) {
        /*
        parse the classTime and return which day the class is on and what time it takes place
        remark: all time are calculated in minute form, starting at 0 and end at 24 * 60
        :param classTime: give the clclassList[classNum][choiceNum][0ass time in form of String
        :return: date: List, timeBlock: List
        */
        if (classTime === 'TBA') {
            /*there is TBA*/
            return ['None', 'None'];
        }
        const pattern = /([A-Za-z]*)\s([0-9]+.*)/i;
        const match = classTime.match(pattern);

        const dates = match[1];
        const times = match[2];
        const date = [];
        for (let i = 0; i < dates.length; i += 2) {
            date.push(dates.slice(i, i + 2));
        }
        const time = times.trim().split('-');
        const timeBlock = [0, 0];
        let count = 0;
        let tempTime;
        for (const j of time) {
            if (j.includes('12') && j.includes('PM')) {
                tempTime = j
                    .replace('PM', '')
                    .trim()
                    .split(':');
                timeBlock[count] += Number(tempTime[0]) * 60 + Number(tempTime[1]);
            } else if (j.includes('AM')) {
                tempTime = j
                    .replace('AM', '')
                    .trim()
                    .split(':');
                timeBlock[count] += Number(tempTime[0]) * 60 + Number(tempTime[1]);
            } else if (j.includes('PM')) {
                tempTime = j
                    .replace('PM', '')
                    .trim()
                    .split(':');
                timeBlock[count] += (Number(tempTime[0]) + 12) * 60 + Number(tempTime[1]);
            }
            count++;
        }
        return [date, timeBlock];
    }
}

export { ScheduleGenerator };
