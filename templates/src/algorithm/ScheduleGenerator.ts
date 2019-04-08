import Catalog from '../models/Catalog';
import ScheduleEvaluator, { SortOptions } from './ScheduleEvaluator';
import Schedule from '../models/Schedule';
import Section from '../models/Section';
import Event from '../models/Event';
import * as Utils from '../models/Utils';

export interface TimeDict {
    [x: string]: number[] | undefined;
    Mo?: number[];
    Tu?: number[];
    We?: number[];
    Th?: number[];
    Fr?: number[];
}

/**
 * The data structure used in the algorithm
 * e.g. `["span20205",["Mo":[600,650],"Tu":[600,650]],[0, 1, 2]]`
 */
export type RawAlgoCourse = [string, TimeDict, number[]];

/**
 * A schedule is nothing more than an array of courses
 */
export type RawAlgoSchedule = RawAlgoCourse[];

export interface Options {
    [x: string]: any;
    events: Event[];
    status: string[];
    noClassDay: string[];
    sortOptions: SortOptions;
}

class ScheduleGenerator {
    public static readonly optionDefaults: Options = {
        events: [],
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

    public catalog: Catalog;
    public options: Options;
    constructor(allRecords: Catalog) {
        this.catalog = allRecords;
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

            const timeSlots: TimeDict[] = [];

            for (const event of this.options.events) {
                timeSlots.push(event.toTimeDict());
            }

            for (const key in courses) {
                const classes: RawAlgoSchedule = [];
                /**
                 * get course with specific sections specified by Schedule
                 */
                const courseRec = this.catalog.getCourse(key, courses[key]);

                // combine any section of occuring at the same time
                const combined = courseRec.getCombined();
                for (const time in combined) {
                    let no_match = false;
                    const sids = combined[time];
                    const algoCourse: RawAlgoCourse = [key, {}, []];
                    const tmp_dict: TimeDict = {};

                    for (const t of time.split('|')) {
                        // skip empty string
                        if (!t) {
                            continue;
                        }
                        const tmp1 = Utils.parseTimeAll(t);
                        if (tmp1 === null) {
                            no_match = true;
                            break;
                        }

                        const [date, timeBlock] = tmp1;
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

                    for (const td of timeSlots) {
                        if (Utils.checkTimeConflict(td, tmp_dict)) {
                            no_match = true;
                            break;
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
        let pathMemory = new Int32Array(classList.length);
        let timeTable: RawAlgoSchedule = [];

        const evaluator = new ScheduleEvaluator(
            this.options.sortOptions,
            this.options.events.filter(x => x.display)
        );
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
        pathMemory: Int32Array,
        timeTable: RawAlgoSchedule
    ): [number, number, Int32Array, RawAlgoSchedule, boolean] {
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
     * :return: Boolean type: true if it has conflict, else false
     */
    public checkTimeConflict(timeTable: RawAlgoSchedule, timeDict: TimeDict) {
        for (const algoCourse of timeTable) {
            if (Utils.checkTimeConflict(algoCourse[1], timeDict)) return true;
        }
        return false;
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
}

export default ScheduleGenerator;
