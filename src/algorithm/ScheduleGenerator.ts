/**
 * @module algorithm
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
import { CourseStatus, Week } from '@/models/Meta';
import { NotiMsg } from '@/store/notification';

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
 * `TimeArray` is a data structure used to store the time blocks in a week
 * that a certain `Section` or `Event` will take place.
 *
 * Index from 0 to 4 represent days from Monday to Friday.
 * The values are **flattened** arrays of `TimeBlock`s, e.g. `[100, 200, 300, 400]`.
 *
 * @remarks The values are not simply `TimeBlock`s
 * because it is possible for a single section to have multiple meetings in a day
 *
 * Example:
 * ```js
 * const timeDict = [ [600, 660, 900, 960], [], [], [],  [1200, 1260] ]
 * ```
 * represents that this `Section` or `Event` will take place
 * every Monday 10:00 to 11:00 and 15:00 to 16:00 and Friday 20:00 to 21:00
 *
 * @see [[TimeBlock]]
 */
export interface TimeArray extends Week<number> {}
/**
 * index: same as TimeArray
 *
 * value: the name of the building
 *
 * if `timeDict[i]` is not empty, then `roomDict[i][j]` corresponds the room of the time block
 * `[timeDict[i][j * 2], timeDict[i][j * 2 + 1]]`. The following assertion will always be true:
 * ```js
 * if (timeDict[i].length)
 *     expect(timeDict[i].length).toBe(roomDict[i].length * 2);
 * ```
 */
export interface RoomArray extends Week<string> {}

/**
 * index: same as TimeArray
 *
 * values: the index of the building in the building list
 *
 * @see https://github.com/awesome-schedule/data/blob/master/Distance/Building_Array.json
 */
export interface RoomNumberArray extends Week<number> {}

/**
 * The data structure used in the algorithm to represent a Course that
 * possibly has multiple sections combined (occurring at the same time)
 *
 * 0: key of this course
 * 1: TimeArray
 * 2: an array of section indices
 * 3: RoomNumberArray
 *
 * Example:
 * ```js
 * ["span20205",[[600,650], [600,650], [], [], []], [0, 1, 2]]
 * ```
 *
 * @see [[TimeArray]]
 */
export type RawAlgoCourse = [string, TimeArray, number[], RoomNumberArray];

/**
 * A schedule is an array of `RawAlgoCourse`
 */
export type RawAlgoSchedule = RawAlgoCourse[];

export interface GeneratorOptions {
    [x: string]: any;
    timeSlots: Event[];
    status: CourseStatus[];
    sortOptions: EvaluatorOptions;
    combineSections: boolean;
    maxNumSchedules: number;
}

/**
 * The schedule generator generates all possible schedules satisfying the given constraints (filters)
 * out of the courses/sections that the user has selected
 */
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
     * Note that this method does not need to run very fast. It only preprocess the selected
     * courses so that they are stored in a desirable format.
     *
     * @see [[ScheduleEvaluator]]
     */
    public getSchedules(schedule: Schedule): NotiMsg<ScheduleEvaluator> {
        console.time('algorithm bootstrapping');
        const buildingList: string[] = this.buildingList;

        // convert events to TimeArrays so that we can easily check for time conflict
        const timeSlots: TimeArray[] = schedule.events.map(e => e.toTimeArray());
        for (const event of this.options.timeSlots) timeSlots.push(event.toTimeArray());

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
                const roomNumberDict: RoomNumberArray = [[], [], [], [], []];
                if (buildingList && buildingList.length) {
                    for (let i = 0; i < roomNumberDict.length; i++) {
                        const numberList = roomNumberDict[i];
                        const rooms = roomDict[i];
                        for (const room of rooms) {
                            const roomMatch = findBestMatch(room.toLowerCase(), buildingList);
                            // we set the match threshold to 0.4
                            if (roomMatch.bestMatch.rating >= 0.4) {
                                numberList.push(roomMatch.bestMatchIndex);
                            } else {
                                // mismatch!
                                console.warn(room, 'match not found!');
                                numberList.push(-1);
                            }
                        }
                    }
                } else {
                    for (let i = 0; i < roomDict.length; i++) {
                        roomNumberDict[i] = (roomDict[i] as string[]).map(() => -1);
                    }
                }

                if (sectionIndices.length !== 0)
                    classes.push([key, timeDict, sectionIndices, roomNumberDict]);
            }

            // throw an error of none of the sections pass the filter
            if (classes.length === 0) {
                return {
                    level: 'error',
                    msg: `No sections of ${courseRec.department} ${courseRec.number} ${
                        courseRec.type
                    } do not conflict your events and satisfy your filters`
                };
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

        const size = evaluator.size();
        if (size > 0) {
            evaluator.computeCoeff();
            evaluator.sort();
            return {
                level: 'success',
                msg: `${size} Schedules Generated!`,
                payload: evaluator
            };
        } else
            return {
                level: 'error',
                msg: 'Given your filter, we cannot generate schedules without overlapping classes'
            };
    }

    /**
     * @param classList a tuple of sections of courses,
     * whose length is the number of distinct courses chosen
     *
     * ```js
     * classList[i][j] // represents the jth section of the ith class
     * ```
     * @requires optimization
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
