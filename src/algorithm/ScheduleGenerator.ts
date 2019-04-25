import Catalog from '../models/Catalog';
import ScheduleEvaluator, { SortOptions } from './ScheduleEvaluator';
import Schedule from '../models/Schedule';
import Event from '../models/Event';
import * as Utils from '../models/Utils';
import { findBestMatch } from 'string-similarity';

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
 * const timeDict = {Mo: [600, 660, 900, 960], Fr: [1200, 1260]}
 * // represents that this `Section` or `Event` will
 * // take place every Monday 10:00 to 11:00 and 15:00 to 16:00 and Friday 20:00 to 21:00
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

export interface RoomDict {
    [x: string]: string[];
}

export interface RoomNumberDict {
    [x: string]: number[];
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
export type RawAlgoCourse = [string, TimeDict, number[], RoomNumberDict];

/**
 * A schedule is an array of `RawAlgoCourse`
 */
export type RawAlgoSchedule = RawAlgoCourse[];

export interface Options {
    [x: string]: any;
    events: Event[];
    timeSlots: Event[];
    status: string[];
    sortOptions: SortOptions;
    combineSections: boolean;
    maxNumSchedules: number;
}

class ScheduleGenerator {
    public static readonly optionDefaults: Options = {
        events: [],
        status: [],
        timeSlots: [],
        sortOptions: ScheduleEvaluator.getDefaultOptions(),
        combineSections: true,
        maxNumSchedules: 200000
    };

    /**
     * validate the options object. Default values are supplied for missing keys.
     * @param options
     */
    public static validateOptions(options: Options) {
        if (!options) return ScheduleGenerator.optionDefaults;
        for (const field in ScheduleGenerator.optionDefaults) {
            if (!options[field] && options[field] !== false) {
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
     *
     * Note that this method does not need to run very fast. It only preprocess the select
     * courses so that they are stored in a desirable format.
     *
     * @see ScheduleEvaluator
     */
    public getSchedules(
        schedule: Schedule,
        options: Options = ScheduleGenerator.optionDefaults
    ): ScheduleEvaluator {
        console.time('algorithm bootstrapping');
        this.options = ScheduleGenerator.validateOptions(options);
        const buildingList: string[] = window.buildingList;

        // convert events to TimeDicts so that we can easily check for time conflict
        const timeSlots: TimeDict[] = this.options.events.map(e => e.toTimeDict());
        for (const event of this.options.timeSlots) timeSlots.push(event.toTimeDict());

        const classList: RawAlgoSchedule[] = [];
        const courses = schedule.All;

        // for each course selected, form an array of sections
        for (const key in courses) {
            const classes: RawAlgoSchedule = [];

            // get course with specific sections specified by Schedule
            const courseRec = this.catalog.getCourse(key, courses[key]);

            // combine all sections of this course occurring at the same time, if enabled
            const combined = this.options.combineSections
                ? Object.values(courseRec.getCombined())
                : courseRec.sections.map(s => [s]);

            // for each combined section, form a RawAlgoCourse
            for (const sections of combined) {
                let no_match = false;

                // only take the time and room info of the first section
                // time will be the same for sections in this array
                // but rooms..., well this is a compromise
                const tmp = sections[0].getRoomTime();
                if (!tmp) continue;

                const [timeDict, roomDict] = tmp;

                // don't include this combined section if it conflicts with any time filter or event,.
                for (const td of timeSlots) {
                    if (Utils.checkTimeConflict(td, timeDict)) {
                        no_match = true;
                        break;
                    }
                }
                if (no_match) continue;

                const sectionIndices: number[] = [];
                for (const section of sections) {
                    // filter out sections with unwanted status
                    if (this.options.status.includes(section.status)) continue;

                    sectionIndices.push(section.sid);
                }

                // Map the room to a number
                const roomNumberDict: RoomNumberDict = {};
                for (const day in roomDict) {
                    const numberList: number[] = [];
                    for (const room of roomDict[day]) {
                        const roomMatch = findBestMatch(room.toLowerCase(), buildingList);
                        // we set the match threshold to 0.5
                        if (roomMatch.bestMatch.rating >= 0.5) {
                            numberList.push(roomMatch.bestMatchIndex);
                        } else {
                            // mismatch!
                            console.warn(room, roomMatch);
                            numberList.push(-1);
                        }
                    }
                    roomNumberDict[day] = numberList;
                }

                if (sectionIndices.length !== 0)
                    classes.push([key, timeDict, sectionIndices, roomNumberDict]);
            }

            // throw an error of none of the sections pass the filter
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

    /**
     * @param classList a tuple of sections of courses, whose length is the number of distinct courses chosen
     *
     * @example
     * classList[i][j] // represents the jth section of the ith class
     */
    public createSchedule(classList: RawAlgoCourse[][]) {
        /**
         * current index of course
         */
        let classNum = 0;
        /**
         * the index of the section within the course indicated by `classNum`
         */
        let choiceNum = 0;
        /**
         * record the index of sections that are already tested
         */
        const pathMemory = new Int32Array(classList.length);
        /**
         * The current schedule, build incrementally and in-place.
         * After one successful build, all elements are removed (**in-place**)
         */
        const timeTable: RawAlgoSchedule = [];

        const maxNumSchedules = this.options.maxNumSchedules;

        const evaluator = new ScheduleEvaluator(this.options.sortOptions, this.options.events);
        let exhausted = false;
        // eslint-disable-next-line
        while (true) {
            if (classNum >= classList.length) {
                evaluator.add(timeTable);
                if (evaluator.size() >= maxNumSchedules) break;
                classNum -= 1;
                choiceNum = pathMemory[classNum];
                timeTable.pop();
            }

            /**
             * Algorithm Retract
             * when all possibilities in on class have exhausted, retract one class
             * explore the next possibilities in the nearest possible class
             * reset the memory path forward to zero
             */
            while (choiceNum >= classList[classNum].length) {
                classNum -= 1;
                if (classNum < 0) {
                    exhausted = true;
                    break;
                }
                timeTable.pop();
                choiceNum = pathMemory[classNum];
                for (let i = classNum + 1; i < pathMemory.length; i++) {
                    pathMemory[i] = 0;
                }
            }

            // if all possibilities are exhausted, then break out the loop
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
}

export default ScheduleGenerator;
