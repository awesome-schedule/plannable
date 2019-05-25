/**
 * The schedule generator generates all possible schedules satisfying the given constraints (filters)
 * out of the courses/sections that the user has selected
 *
 * @author Hanzhi Zhou, Zichao Hu
 */

/**
 *
 */
import { findBestMatch } from 'string-similarity';
import Catalog from '../models/Catalog';
import Event from '../models/Event';
import Schedule from '../models/Schedule';
import { checkTimeConflict } from '../utils';
import ScheduleEvaluator, { EvaluatorOptions } from './ScheduleEvaluator';

/**
 * A `TimeBlock` defines the start and end time of a 'Block'
 * that a Meeting will take place. These two numbers are the minutes starting from 0:00
 *
 * To represent time from 10:00 to 11:00:
 * ```js
 * [600, 660]
 * ```
 */
export type TimeBlock = [number, number];

/**
 * The generic type used to store some information about each day within a week
 *
 * @todo decide whether it is better to state the index signature as
 * `[x: string]: T[]` or `[x: string]: T[] | undefined`
 */
export interface WeekDict<T> {
    [x: string]: T[] | undefined;
    Mo?: T[];
    Tu?: T[];
    We?: T[];
    Th?: T[];
    Fr?: T[];
}

/**
 * `TimeDict` is a data structure used to store the time blocks in a week
 * that a certain `Section` or `Event` will take place.
 * The keys of a `TimeDict` are abbreviated day strings like `Mo` or `Tu`.
 * The values are **flattened** arrays of `TimeBlock`s, e.g. `[100, 200, 300, 400]`.
 *
 * @remarks The values are not simply `TimeBlock`s
 * because it is possible for a single section to have multiple meetings in a day
 *
 * Example:
 * ```js
 * const timeDict = {Mo: [600, 660, 900, 960], Fr: [1200, 1260]}
 * ```
 * represents that this `Section` or `Event` will take place
 * every Monday 10:00 to 11:00 and 15:00 to 16:00 and Friday 20:00 to 21:00
 *
 * @see [[TimeBlock]]
 */
export interface TimeDict extends WeekDict<number> {}
/**
 * key: same as TimeDict
 *
 * value: the name of the building
 *
 * if `timeDict[key]` exists, then `roomDict[key][i]` corresponds the room of the time block
 * `[timeDict[key][i * 2], timeDict[key][i * 2 + 1]]`. For example,
 * ```js
 * if (timeDict[key])
 *     expect(timeDict[key].length).toBe(roomDict[key].length / 2);
 * ```
 */
export interface RoomDict extends WeekDict<string> {}

/**
 * key: same as TimeDict
 *
 * value: the index of the building in the building list
 *
 * @see https://github.com/awesome-schedule/data/blob/master/Distance/Building_Array.json
 */
export interface RoomNumberDict extends WeekDict<number> {}

/**
 * The data structure used in the algorithm to represent a Course that
 * possibly has multiple sections combined (occurring at the same time)
 *
 * @property 0: key of this course
 * @property 1: TimeDict
 * @property 2: an array of section indices
 *
 * Example:
 * ```js
 * ["span20205",{"Mo":[600,650],"Tu":[600,650]},[0, 1, 2]]
 * ```
 *
 * @see [[TimeDict]]
 */
export type RawAlgoCourse = [string, TimeDict, number[], RoomNumberDict];

/**
 * A schedule is an array of `RawAlgoCourse`
 */
export type RawAlgoSchedule = RawAlgoCourse[];

export interface GeneratorOptions {
    [x: string]: any;
    timeSlots: Event[];
    status: string[];
    sortOptions: EvaluatorOptions;
    combineSections: boolean;
    maxNumSchedules: number;
}

class ScheduleGenerator {
    public catalog: Catalog;
    public options: GeneratorOptions;
    public buildingList: string[];

    constructor(catalog: Catalog, buildingList: string[], options: GeneratorOptions) {
        this.catalog = catalog;
        this.options = options;
        this.buildingList = buildingList;
    }

    /**
     * The entrance of the schedule generator
     * returns a sorted `ScheduleEvaluator` Object
     *
     * Note that this method does not need to run very fast. It only preprocess the select
     * courses so that they are stored in a desirable format.
     *
     * @see [[ScheduleEvaluator]]
     */
    public getSchedules(schedule: Schedule): ScheduleEvaluator {
        console.time('algorithm bootstrapping');
        const buildingList: string[] = this.buildingList;

        // convert events to TimeDicts so that we can easily check for time conflict
        const timeSlots: TimeDict[] = schedule.events.map(e => e.toTimeDict());
        for (const event of this.options.timeSlots) timeSlots.push(event.toTimeDict());

        const classList: RawAlgoCourse[][] = [];
        const courses = schedule.All;

        // for each course selected, form an array of sections
        for (const key in courses) {
            const classes: RawAlgoCourse[] = [];

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
                const tmp = sections[0].getTimeRoom();
                if (!tmp) continue;

                const [timeDict, roomDict] = tmp;

                // don't include this combined section if it conflicts with any time filter or event,.
                for (const td of timeSlots) {
                    if (checkTimeConflict(td, timeDict)) {
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
                if (buildingList && buildingList.length) {
                    for (const day in roomDict) {
                        const numberList: number[] = [];
                        const rooms = roomDict[day] as string[];
                        for (const room of rooms) {
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
                } else {
                    for (const day in roomDict) {
                        roomNumberDict[day] = (roomDict[day] as string[]).map(x => -1);
                    }
                }

                if (sectionIndices.length !== 0)
                    classes.push([key, timeDict, sectionIndices, roomNumberDict]);
            }

            // throw an error of none of the sections pass the filter
            if (classes.length === 0) {
                throw new Error(
                    `No sections of ${courseRec.department} ${courseRec.number} ${
                        courseRec.type
                    } do not conflict your events and satisfy your filters`
                );
            }
            classList.push(classes);
        }
        // note: this makes the algorithm deterministic
        classList.sort((a, b) => a.length - b.length);
        console.timeEnd('algorithm bootstrapping');

        console.time('running algorithm:');

        const evaluator = new ScheduleEvaluator(this.options.sortOptions, schedule.events);
        this.createSchedule(classList, evaluator);
        console.timeEnd('running algorithm:');

        if (evaluator.size() > 0) {
            evaluator.computeCoeff();
            evaluator.sort();
            return evaluator;
        } else
            throw new Error(
                'Given your filter, we cannot generate schedules without overlapping classes'
            );
    }

    /**
     * @param classList a tuple of sections of courses, whose length is the number of distinct courses chosen
     *
     * ```js
     * classList[i][j] // represents the jth section of the ith class
     * ```
     */
    public createSchedule(classList: RawAlgoCourse[][], evaluator: ScheduleEvaluator) {
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
         * After one successful build, all elements are removed **in-place**
         */
        const timeTable: RawAlgoSchedule = [];

        const maxNumSchedules = this.options.maxNumSchedules;

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

            // the time dict of the newly chosen class
            const timeDict = classList[classNum][choiceNum][1];
            let conflict = false;
            for (const algoCourse of timeTable) {
                if (checkTimeConflict(algoCourse[1], timeDict)) {
                    conflict = true;
                    break;
                }
            }

            if (conflict) {
                choiceNum += 1;
            } else {
                // if the schedule matches,
                // record the next path memory and go to the next class, reset the choiceNum = 0
                timeTable.push(classList[classNum][choiceNum]);
                pathMemory[classNum] = choiceNum + 1;
                classNum += 1;
                choiceNum = 0;
            }
        }
    }
}

export default ScheduleGenerator;
