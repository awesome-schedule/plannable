import Catalog from '../models/Catalog';
import Course from '../models/Course';
import ScheduleEvaluator, { SortOptions } from './ScheduleEvaluator';
import Schedule from '../models/Schedule';
import Section from '../models/Section';
import { tmpdir } from 'os';

/**
 * The data structure used in the algorithm
 * e.g. `["span20205",["Mo":[600,650],"Tu":[600,650]],[0, 1, 2]]`
 */
export type RawAlgoCourse = [string, { [x: string]: number[] }, number[]];

/**
 * A schedule is nothing more than an array of courses
 */
export type RawAlgoSchedule = RawAlgoCourse[];

export interface Options {
    [x: string]: any;
    timeSlots: Array<[number, number]>;
    status: string[];
    noClassDay: string[];
    sortOptions: SortOptions;
}

class ScheduleGenerator {
    public static readonly optionDefaults: Options = {
        timeSlots: [],
        status: [],
        noClassDay: [],
        sortOptions: ScheduleEvaluator.getDefaultOptions()
    };

    public static validateOptions(options: Options) {
        if (!options) return ScheduleGenerator.optionDefaults;
        for (const field in ScheduleGenerator.optionDefaults) {
            if (!options[field]) {
                console.warn(`Non-existent field ${field}. Default value used`);
                options[field] = ScheduleGenerator.optionDefaults[field];
            }
        }
        return options;
    }

    public allRecords: Catalog;
    public options: Options;
    constructor(allRecords: Catalog) {
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
                    let no_match = false;
                    const sids = combined[time];
                    const algoCourse: RawAlgoCourse = [key, {}, []];
                    const tmp_dict: { [x: string]: number[] } = {};

                    for (const t of time.split('|')) {
                        const tmp1 = this.parseTime(t);
                        if (tmp1 === null) {
                            no_match = true;
                            break;
                        }

                        const [date, timeBlock] = tmp1;

                        if (this.filterTimeSlots(date, timeBlock)) {
                            no_match = true;
                            break;
                        }

                        for (const d of date) {
                            // the timeBlock is flattened
                            const dayBlock = tmp_dict[d];
                            if (dayBlock) {
                                dayBlock.push.apply(dayBlock, timeBlock);
                            } else {
                                tmp_dict[d] = timeBlock.concat();
                            }
                        }
                    }
                    if (no_match) {
                        continue;
                    }
                    algoCourse[1] = tmp_dict;

                    for (const sid of sids) {
                        const section = courseRec.getSection(sid);
                        // insert filter method
                        if (this.filterStatus(section)) continue;
                        algoCourse[2].push(sid);
                    }
                    if (algoCourse[2].length !== 0) classes.push(algoCourse);
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

            const timeDict = classList[classNum][choiceNum][1];

            if (!this.checkTimeConflict(timeTable, timeDict)) {
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
    public checkTimeConflict(timeTable: RawAlgoSchedule, timeDict: { [x: string]: number[];}) {
        if (timeTable === []) {
            return false;
        }

        for (const algoCourse of timeTable) {
            for (const dayBlock in algoCourse[1]) {
                if (!timeDict[dayBlock]) {
                    break;
                }
                const timeTableBlocks = algoCourse[1][dayBlock];
                const timeDictBlocks = timeDict[dayBlock];
                for (let i = 0; i < timeTableBlocks.length; i += 2) {
                    const begin = timeTableBlocks[i];
                    const end = timeTableBlocks[i];
                    for (let j = 0; j < timeDictBlocks.length; j += 2) {
                        const beginTime = timeDictBlocks[j];
                        const endTime = timeDictBlocks[j];
                        if (
                            (begin <= beginTime && beginTime <= end) ||
                            (begin <= endTime && endTime <= end) ||
                            (begin >= beginTime && end <= endTime)
                        ) {
                            return true;
                        }
                    }
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

    public filterStatus(section: Section) {
        // const standard = Object.values(CourseRecord.STATUSES);
        // // console.log(option.status.includes(course.status), option.status, course.status);
        // if (!standard.includes(course.status)) {
        //     return true;
        // }

        if (this.options.status.includes(section.status)) {
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
