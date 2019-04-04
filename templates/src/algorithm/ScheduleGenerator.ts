// @ts-check
import AllRecords from '../models/AllRecords';
import CourseRecord from '../models/CourseRecord';
import ScheduleEvaluator from './ScheduleEvaluator';
import Schedule from '../models/Schedule';
import Course from '../models/Course';

/**
 * The data structure used in the algorithm
 * e.g. `["span20205",["Mo","Tu"],[600,650],[0, 1, 2]]`
 */
export type RawAlgoCourse = [string, string[], number[], number[]];

/**
 * A schedule is nothing more than an array of courses
 */
export type RawAlgoSchedule = RawAlgoCourse[];

export interface SortOptions {
    sortBy: {
        [x: string]: boolean;
        variance: boolean;
        compactness: boolean;
        lunchTime: boolean;
        IamFeelingLucky: boolean;
    };
    reverseSort: boolean;
}

export interface Options {
    [x: string]: any;
    timeSlots: Array<[number, number]>;
    status: string[];
    noClassDay: string[];
    sortOptions: SortOptions;
}

class ScheduleGenerator {
    public static optionDefaults: Options = {
        timeSlots: [],
        status: [],
        noClassDay: [],
        sortOptions: ScheduleEvaluator.optionDefaults
    };

    public static validateOptions(options: Options) {
        if (!options) return ScheduleGenerator.optionDefaults;
        for (const field in ScheduleGenerator.optionDefaults) {
            if (options[field] === undefined) {
                options[field] = ScheduleGenerator.optionDefaults[field];
            }
        }
        return options;
    }

    public allRecords: AllRecords;
    public options: Options;
    constructor(allRecords: AllRecords) {
        this.allRecords = allRecords;
        this.options = ScheduleGenerator.optionDefaults;
    }

    /**
     * The entrance of the schedule generator
     * returns a sorted `ScheduleEvaluator` Object
     * @see ScheduleEvaluator
     */
    public getSchedules(
        schedule: Schedule,
        options: Options = ScheduleGenerator.optionDefaults
    ): Promise<ScheduleEvaluator> {
        return new Promise((resolve, reject) => {
            this.options = ScheduleGenerator.validateOptions(options);

            const courses = schedule.All;

            const classList: RawAlgoSchedule[] = [];
            for (const key in courses) {
                const classes: RawAlgoSchedule = [];
                /**
                 * get course with specific sections specified by Schedule
                 */
                const courseRec = this.allRecords.getRecord(key, courses[key]);

                const combined = courseRec.getCombined();
                for (const time in combined) {
                    const sids = combined[time];
                    const tmp1 = this.parseTime(time);
                    // do not include any TBA
                    if (tmp1 === null) continue;
                    const [date, timeBlock] = tmp1;
                    if (this.filterTimeSlots(date, timeBlock)) continue;

                    const algoCourse: RawAlgoCourse = [key, date, timeBlock, []];

                    for (const sid of sids) {
                        const course = courseRec.getCourse(sid);
                        // insert filter method
                        if (this.filterStatus(course)) continue;
                        algoCourse[3].push(sid);
                    }
                    if (algoCourse[3].length !== 0) classes.push(algoCourse);
                }

                if (classes.length === 0) {
                    reject(
                        `No sections of ${courseRec.department} ${courseRec.number} ${
                            courseRec.type
                        } satisfy the filters you given`
                    );
                }
                classList.push(classes);
            }
            // note: this makes the algorithm deterministic
            classList.sort((a, b) => a.length - b.length);
            const result = this.createSchedule(classList);
            if (result.size() > 0) {
                result.computeCoeff();
                result.sort();
                resolve(result);
            } else
                reject(
                    'Given your filter, we cannot generate schedules without overlapping classes'
                );
        });
    }

    public createSchedule(classList: RawAlgoSchedule[]) {
        let classNum = 0;
        let choiceNum = 0;
        let pathMemory = Array.from({ length: classList.length }, () => 0);
        let timeTable = new Array();
        const evaluator = new ScheduleEvaluator(this.options.sortOptions);
        let exhausted = false;
        // eslint-disable-next-line
        while (true) {
            if (classNum >= classList.length) {
                evaluator.add(timeTable);
                if (evaluator.size() >= 100000) break;
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
                // if the schedule matches,
                // record the next path memory and go to the next class, reset the choiceNum = 0
                timeTable.push(classList[classNum][choiceNum]);
                pathMemory[classNum] = choiceNum + 1;
                classNum += 1;
                choiceNum = 0;
            } else {
                choiceNum += 1;
            }
        }
        return evaluator;
    }

    public AlgorithmRetract(
        classList: RawAlgoSchedule[],
        classNum: number,
        choiceNum: number,
        pathMemory: number[],
        timeTable: RawAlgoSchedule
    ): [number, number, number[], RawAlgoSchedule, boolean] {
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
     * compare the new class to see if it has conflicts with the existing time table
     * :param timeTable: three entries: 1. the class serial number, 2. the date 3. the time
     * :param date: contains the date when the class takes place
     * :param timeBlock: contains beginTime and endTime of a class
     * :return: Boolean type: true if it has conflict, else false
     */
    public checkTimeConflict(timeTable: RawAlgoSchedule, date: string[], timeBlock: number[]) {
        if (date === null) {
            // do not include any TBA
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
                    (begin <= endTime && endTime <= end) ||
                    (begin >= beginTime && end <= endTime)
                ) {
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * parse the classTime and return which day the class is on and what time it takes place
     * remark: all time are calculated in minute form, starting at 0 and end at 24 * 60
     *
     * returns null when fail to parse
     * @param {string} classTime
     */
    public parseTime(classTime: string): [string[], [number, number]] | null {
        if (classTime === 'TBA') {
            return null;
        }
        const pattern = /([A-Za-z]*)\s([0-9]+.*)/i;
        const match = classTime.match(pattern);
        if (match === null) return null;
        const dates = match[1];
        const times = match[2];
        const date = [];
        for (let i = 0; i < dates.length; i += 2) {
            date.push(dates.substring(i, i + 2));
        }
        const time = times.trim().split('-');
        const timeBlock: [number, number] = [0, 0];
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

    public filterStatus(course: Course) {
        const standard = Object.values(CourseRecord.STATUSES);
        // console.log(option.status.includes(course.status), option.status, course.status);
        if (!standard.includes(course.status)) {
            return true;
        }

        if (this.options.status.includes(course.status)) {
            return true;
        }
        return false;
    }

    public filterTimeSlots(date: string[], timeBlock: [number, number]) {
        const ts = this.options.timeSlots;

        // noClassDay is a list of strings of dates, e.g. ['Mo','Tu']
        const noClassDay = this.options.noClassDay;

        // Compare and check if any time/date overlaps. If yes, return true, else false.
        const beginTime = timeBlock[0];
        const endTime = timeBlock[1];
        for (const times of ts) {
            const begin = times[0];
            const end = times[1];

            if (
                (begin <= beginTime && beginTime <= end) ||
                (begin <= endTime && endTime <= end) ||
                (begin >= beginTime && end <= endTime)
            ) {
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

export default ScheduleGenerator;
