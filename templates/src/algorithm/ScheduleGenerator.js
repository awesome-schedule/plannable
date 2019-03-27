import CourseRecord from '../models/CourseRecord';
import { ScheduleEvaluator } from './ScheduleEvaluator';
/**
 * @typedef {[string,string[],number[],number][]} RawSchedule
 */
/**
 * @typedef {{timeSlots: [number, number][], status: string[], noClassDay: string[]}} Constraint
 */
class ScheduleGenerator {
    static constraintDefaults = {
        timeSlots: [],
        status: [],
        noClassDay: []
    };
    /**
     *
     * @param {import('../models/AllRecords').default} allRecords
     */
    constructor(allRecords) {
        this.allRecords = allRecords;
    }

    /**
     * check if constraint fields satisfy the required format
     * @param {Constraint} constraint
     */
    validateConstraints(constraint) {
        for (const field in ScheduleGenerator.constraintDefaults) {
            if (constraint[field] === undefined) {
                constraint[field] = ScheduleGenerator.constraintDefaults[field];
            }
        }
    }

    /**
     * The entrance of the schedule generator
     * Read from **schedule.All** and collect data from **allRecords**
     * Collect data from **section(index)[7]**
     * Parse the **days** into desired format: **{[ string[], number[] ]}**
     * e.g. [ ["Mo","Tu"],[600,650] ]
     * concatenate with the **key** and push into the **classList** to form a 3D array
     * e.g. [ [ ["span20205",["Mo","Tu"],[600,650]], ["span20205",["Th","Fr"],[720,770]] ],
     *        [ ["cs21105"  ,["Mo","We"],[400,450]], ["cs21105"  ,["We","Fr"],[900,975]] ] ]
     * Pass the **ClassList** into the **createSchedule**
     * return a **FinalTable** Object
     * @param {import('../models/Schedule').default} schedule
     * @param {Constraint} constraint
     * @return {ScheduleEvaluator}
     */
    getSchedules(schedule, constraint = ScheduleGenerator.constraintDefaults) {
        this.validateConstraints(constraint);

        const courses = schedule.All;

        /**
         * @type {RawSchedule[]}
         */
        const classList = [];
        for (const key in courses) {
            /**
             * @type {RawSchedule}
             */
            const classes = [];
            //get full course records
            const courseRecFull = this.allRecords.getRecord(key);
            //get course with specific sections
            if (courses[key] === -1) {
                for (let section = 0; section < courseRecFull.section.length; section++) {
                    const course = courseRecFull.getCourse(section);
                    //insert filter method
                    if (this.filterStatus(course, constraint)) {
                        continue;
                    }

                    const day = course.days;
                    const [date, timeBlock] = this.parseTime(day);
                    if (date === null) {
                        //do not include any TBA
                        continue;
                    }
                    if (this.filterTimeSlots(date, timeBlock, constraint)) {
                        continue;
                    }

                    classes.push([key, date, timeBlock, section]);
                }
            } else {
                for (const section of courses[key]) {
                    const course = courseRecFull.getCourse(section);
                    //insert filter method
                    if (this.filterStatus(course, constraint)) {
                        continue;
                    }

                    const day = course.days;
                    const [date, timeBlock] = this.parseTime(day);
                    if (date === null) {
                        //do not include any TBA
                        continue;
                    }
                    if (this.filterTimeSlots(date, timeBlock, constraint)) {
                        continue;
                    }

                    classes.push([key, date, timeBlock, section]);
                }
            }
            if (classes.length === 0) {
                const error = courseRecFull.department + courseRecFull.number + courseRecFull.type;
                throw `No ${error}`;
            }
            classList.push(classes);
            // console.log(classList);
        }

        const result = this.createSchedule(classList);
        // console.log(result.finalTable.toArray());
        return result;
    }

    /**
     *
     * @param {RawSchedule[]} classList
     * */
    createSchedule(classList) {
        /**
         * classList Array --> [keys,[days],[start,end],index] --> 3D array
         * finatable Object --> [keys,[days],[start,end],index] --> 2D array
         */

        let classNum = 0;
        let choiceNum = 0;
        let pathMemory = Array.from({ length: classList.length }, () => 0);
        let timeTable = new Array();
        const finalTable = new ScheduleEvaluator();
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
                timeTable.push(classList[classNum][choiceNum]);
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
     * @param {RawSchedule} timeTable
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
     * @param {RawSchedule} timeTable
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
        if (date === null) {
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
     * @return {[string[], number[]]}
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
            return [null, null];
        }
        const pattern = /([A-Za-z]*)\s([0-9]+.*)/i;
        const match = classTime.match(pattern);

        const dates = match[1];
        const times = match[2];
        const date = [];
        for (let i = 0; i < dates.length; i += 2) {
            date.push(dates.substring(i, i + 2));
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

    /**
     *
     * @param {Course} course
     * @param {{timeSlots: [number, number][], status: string[],noClassDay: string[]}} constraint
     */
    filterStatus(course, constraint) {
        const standard = Object.values(CourseRecord.STATUSES);
        // console.log(constraint.status.includes(course.status), constraint.status, course.status);
        if (!standard.includes(course.status)) {
            return true;
        }

        if (constraint.status.includes(course.status)) {
            return true;
        }
        return false;
    }

    /**
     *
     * @param {[string,string,string...]} date
     * @param {[number,number]} timeBlock
     * @param {{timeSlots: [number, number][], status: string[],noClassDay: string[]}} constraint
     */
    filterTimeSlots(date, timeBlock, constraint) {
        //ts is the timeslots --> 2D array
        const ts = constraint.timeSlots;

        //noClassDay is a list of strings of dates, e.g. ['Mo','Tu']
        const noClassDay = constraint.noClassDay;

        //Compare and check if any time/date overlaps. If yes, return true, else false.
        const beginTime = timeBlock[0];
        const endTime = timeBlock[1];
        for (const times of ts) {
            const begin = times[0];
            const end = times[1];

            if ((begin <= beginTime && beginTime <= end) || (begin <= endTime && endTime <= end)) {
                return true;
            }
        }

        for (const d of noClassDay) {
            if (date.includes(d)) {
                return true;
            }
        }
        return false;
    }
}

export { ScheduleGenerator };
