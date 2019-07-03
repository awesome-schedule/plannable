/**
 * @module algorithm
 * @author Hanzhi Zhou, Zichao Hu
 */

/**
 *
 */
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
 * The blocks is a iliffe vector storing the time and room information of the an entity at each day.
 * Index from 0 to 4 represents days from Monday to Friday.
 * Example:
 * ```js
 * const timeDict = [ [600, 660, 11, 900, 960, 2], [], [], [],  [1200, 1260, 12] ]
 * ```
 * represents that this entity will take place
 * every Monday 10:00 to 11:00 at room index 11, 15:00 to 16:00 at room 2,
 * and Friday 20:00 to 21:00 at room 12
 *
 * a typical loop that visits these info is shown below
 * ```js
 * for (const day of blocks) {
 *     for (let i = 0; i < day.length; i += 3) {
 *         const start = day[i]; // start time of the `i / 3`th class
 *         const end = day[i + 1]; // end time of the `i / 3`th class
 *         const roomNumber = day[i + 2]; // room index of the `i / 3`th class
 *     }
 * }
 * ```
 */
export interface TimeArray extends Week<number> {}

/**
 * The data structure used in the algorithm to represent a Course that
 * possibly has multiple sections combined (occurring at the same time)
 *
 * 0: key of this course
 * 1: an array of section indices
 * 2: TimeArray
 *
 * Example:
 * ```js
 * ["span20205", [0, 1, 2], [[600, 650, 1], [600, 650, 3], [], [], []]]
 * ```
 */
export type RawAlgoCourse = [string, number[], TimeArray];

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
    constructor(
        public readonly catalog: Readonly<Catalog>,
        public readonly buildingList: ReadonlyArray<string>,
        public readonly options: GeneratorOptions
    ) {}

    /**
     * The entrance of the schedule generator
     * returns a sorted `ScheduleEvaluator` Object
     *
     * This method does not need to run very fast. It only preprocess the selected
     * courses so that they are stored in a desirable format.
     *
     * @see [[ScheduleEvaluator]]
     */
    public getSchedules(schedule: Schedule): NotiMsg<ScheduleEvaluator> {
        console.time('algorithm bootstrapping');

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
                // only take the time and room info of the first section
                // time will be the same for sections in this array
                // but rooms..., well this is a compromise
                const blocksArray = sections[0].getTimeRoom();
                if (!blocksArray) continue;

                // don't include this combined section if it conflicts with any time filter or event.
                let conflict = false;
                for (const td of timeSlots) {
                    if (checkTimeConflict(td, blocksArray, 2, 3)) {
                        conflict = true;
                        break;
                    }
                }
                if (conflict) continue;

                const sectionIndices: number[] = [];
                for (const section of sections) {
                    // filter out sections with unwanted status
                    if (this.options.status.includes(section.status)) continue;

                    sectionIndices.push(section.sid);
                }

                if (sectionIndices.length) classes.push([key, sectionIndices, blocksArray]);
            }

            // throw an error of none of the sections pass the filter
            if (classes.length === 0) {
                return {
                    level: 'error',
                    msg: `No sections of ${courseRec.department} ${courseRec.number} ${
                        courseRec.type
                    } satisfy your filters and do not conflict with your events`
                };
            }
            classList.push(classes);
        }
        // note: this makes the algorithm deterministic
        classList.sort((a, b) => a.length - b.length);
        console.timeEnd('algorithm bootstrapping');

        console.time('running algorithm:');
        const evaluator = new ScheduleEvaluator(
            this.options.sortOptions,
            window.timeMatrix,
            schedule.events
        );
        this.createSchedule(classList, evaluator);

        // free a little memory by removing the time amd room info,
        // which are no longer needed, from each section
        classList.forEach(sections => sections.forEach(section => section.splice(2)));
        console.timeEnd('running algorithm:');

        const size = evaluator.size();
        if (size > 0) {
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
         * the total number of schedules already generated
         */
        let count = 0;
        /**
         * the number of courses in total (cached variable for efficiency)
         */
        const numCourses = classList.length;
        /**
         * record the index of sections that are already tested
         */
        const pathMemory = new Int32Array(numCourses);
        /**
         * The current schedule, build incrementally and in-place.
         * After one successful build, all elements are removed **in-place**
         */
        const currentSchedule: RawAlgoSchedule = [];
        const { maxNumSchedules } = this.options;
        while (true) {
            if (classNum >= numCourses) {
                evaluator.add(currentSchedule.concat());
                if (++count >= maxNumSchedules) return;
                choiceNum = pathMemory[--classNum];
            }

            /**
             * when all possibilities in on class have exhausted, retract one class
             * explore the next possibilities in the nearest possible class
             * reset the memory path forward to zero
             */
            while (choiceNum >= classList[classNum].length) {
                // if all possibilities are exhausted, then break out the loop
                if (--classNum < 0) return;

                choiceNum = pathMemory[classNum];
                pathMemory.fill(0, classNum + 1);
            }

            // the time dict of the newly chosen class
            const candidate = classList[classNum][choiceNum];
            const timeDict = candidate[2];
            let conflict = false;
            for (let i = 0; i < classNum; i++) {
                if (checkTimeConflict(currentSchedule[i][2], timeDict, 3, 3)) {
                    conflict = true;
                    break;
                }
            }

            if (conflict) {
                ++choiceNum;
            } else {
                // if the schedule matches,
                // record the next path memory and go to the next class, reset the choiceNum = 0
                currentSchedule[classNum] = candidate;
                pathMemory[classNum++] = choiceNum + 1;
                choiceNum = 0;
            }
        }
    }
}

export default ScheduleGenerator;
