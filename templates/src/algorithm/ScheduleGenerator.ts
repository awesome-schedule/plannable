import Catalog from '../models/Catalog';
import ScheduleEvaluator, { SortOptions } from './ScheduleEvaluator';
import Schedule from '../models/Schedule';
import Section from '../models/Section';
import Event from '../models/Event';
import * as Utils from '../models/Utils';

/**
 * A `TimeBlock` defines the start and end time of a 'Block'
 * that a Meeting will take place. These two numbers are the minutes starting from 0:00
 *
 * @example [600, 660] // represents time from 10:00 to 11:00
 */
export type TimeBlock = [number, number];

/**
 * `TimeDict` is a data structure used to store the time blocks in a week
 * that a certain `Section` or `Event` will take place.
 * The keys of a `TimeDict` are abbreviated day strings like `Mo` or `Tu`.
 * The values are **flattened** arrays of `TimeBlock`s, e.g. `[100, 200, 300, 400]`.
 *
 * @remarks The values are not simply `TimeBlock`s
 * because it is possible for a single section to have multiple meetings in a day
 *
 * @example
 * const timeDict = {Mo: [600, 660, 900, 960], Fr: [1200, 1260]} // represents that this `Section` or `Event` will
 * //take place every Monday 10:00 to 11:00 and 15:00 to 16:00 and Friday 20:00 to 21:00
 *
 * @see TimeBlock
 */
export interface TimeDict {
    [x: string]: number[] | undefined;
    Mo?: number[];
    Tu?: number[];
    We?: number[];
    Th?: number[];
    Fr?: number[];
}

/**
 * The data structure used in the algorithm to represent a Course that
 * possibly has multiple sections combined (occurring at the same time)
 *
 * 0: key of this course
 *
 * 1: TimeDict
 *
 * 2: an array of section indices
 *
 * @example
 * ["span20205",{"Mo":[600,650],"Tu":[600,650]},[0, 1, 2]]
 *
 * @see TimeDict
 */
export type RawAlgoCourse = [string, TimeDict, number[]];

/**
 * A schedule is an array of `RawAlgoCourse`
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
    ): ScheduleEvaluator {
        console.time('algorithm bootstrapping');
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

            // combine any section of occurring at the same time
            const combined = courseRec.getCombined();
            for (const time in combined) {
                let no_match = false;
                const sids = combined[time];
                const algoCourse: RawAlgoCourse = [key, {}, []];
                const tmp_dict: TimeDict = {};

                for (const t of time.split('|')) {
                    // skip empty string
                    if (!t) continue;
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
                            dayBlock.push(...timeBlock);
                        } else {
                            tmp_dict[d] = timeBlock.concat();
                        }
                    }
                }
                if (no_match) continue;

                for (const td of timeSlots) {
                    if (Utils.checkTimeConflict(td, tmp_dict)) {
                        no_match = true;
                        break;
                    }
                }
                if (no_match) continue;

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
                throw new Error(
                    `No sections of ${courseRec.department} ${courseRec.number} ${
                        courseRec.type
                    } satisfy the filters you given`
                );
            }
            classList.push(classes);
        }
        // note: this makes the algorithm deterministic
        classList.sort((a, b) => a.length - b.length);
        console.timeEnd('algorithm bootstrapping');

        console.time('running algorithm:');
        const result = this.createSchedule(classList);
        console.timeEnd('running algorithm:');

        if (result.size() > 0) {
            result.computeCoeff();
            result.sort();
            return result;
        } else
            throw new Error(
                'Given your filter, we cannot generate schedules without overlapping classes'
            );
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
     *
     * @returns true if it has conflict, false otherwise
     */
    public checkTimeConflict(timeTable: RawAlgoSchedule, timeDict: TimeDict) {
        for (const algoCourse of timeTable) {
            if (Utils.checkTimeConflict(algoCourse[1], timeDict)) return true;
        }
        return false;
    }

    public filterStatus(section: Section) {
        return this.options.status.includes(section.status);
    }
}

export default ScheduleGenerator;
