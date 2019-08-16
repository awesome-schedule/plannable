/**
 * @module algorithm
 * @author Hanzhi Zhou, Zichao Hu, Kaiying Cat
 */

/**
 *
 */
import { CourseStatus } from '@/models/Meta';
import { NotiMsg } from '@/store/notification';
import Catalog from '../models/Catalog';
import Event from '../models/Event';
import Schedule, { ScheduleAll } from '../models/Schedule';
import { calcOverlap, checkTimeConflict, parseDate } from '../utils';
import ScheduleEvaluator, { EvaluatorOptions, sortBlocks } from './ScheduleEvaluator';

/**
 * The blocks is a condensed fixed-length array
 * storing the time and room information of the a schedule at each day.
 * Index from 0 to 6 represents the index of information from Monday to Sunday.
 * Index 7 is the length of the array, which is there for convenience.
 * Example:
 * ```js
 * const timeArr = [
 *   7, 7, 7, 7, 13, 13, 13, 13, //indices
 *   600, 660, 11, 900, 960, // Monday
 *   1200, 1260, 12 // Friday
 * ]
 * ```
 * represents that this entity will take place
 * every Monday 10:00 to 11:00 at room index 11, 15:00 to 16:00 at room 2,
 * and Friday 20:00 to 21:00 at room 12
 *
 * a typical loop that visits these info is shown below
 * ```js
 * for (let i = 0; i < 7; i++){
 *   const dayEnd = timeArr[i+1];
 *   for (let j = timeArr[i]; j < dayEnd; j+=3) {
 *     const timeStart = timeArr[j],
 *           timeEnd   = timeArr[j+1],
 *           roomIdx   = timeArr[j+2];
 *     // do some processing
 *   }
 * }
 * ```
 */
export type TimeArray = Int16Array;
/**
 * Start and end date in millisecond (obtained via `Date.getTime`)
 */
export type MeetingDate = [number, number];

/**
 * The data structure used in the algorithm to represent a Course that
 * possibly has multiple sections combined (occurring at the same time)
 *
 * 0: key of this course
 * 1: an array of section indices
 *
 * Example:
 * ```js
 * ["span20205", [0, 1, 2]]
 * ```
 */
export type RawAlgoCourse = [string, number[]];

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
    public getSchedules(
        schedule: Schedule,
        sort = true,
        refSchedule: ScheduleAll<Set<number>> = {}
    ): NotiMsg<ScheduleEvaluator> {
        console.time('algorithm bootstrapping');

        // convert events to TimeArrays so that we can easily check for time conflict
        const timeSlots: TimeArray[] = schedule.events.map(e => e.toTimeArray());
        for (const event of this.options.timeSlots) timeSlots.push(event.toTimeArray());

        const classList: RawAlgoCourse[][] = [];
        const timeArrayList: TimeArray[][] = [];
        const dateList: MeetingDate[][] = [];

        const courses = schedule.All;

        // for each course selected, form an array of sections
        for (const key in courses) {
            const classes: RawAlgoCourse[] = [],
                timeArrays: TimeArray[] = [],
                dates: MeetingDate[] = [];

            // get course with specific sections specified by Schedule
            const courseRec = this.catalog.getCourse(key, courses[key]);

            // combine all sections of this course occurring at the same time, if enabled
            const combined = this.options.combineSections
                ? Object.values(courseRec.getCombined())
                : courseRec.sections.map(s => [s]);

            // for each combined section, form a RawAlgoCourse
            outer: for (const sections of combined) {
                // only take the time and room info of the first section
                // time will be the same for sections in this array
                // but rooms..., well this is a compromise
                const date = parseDate(sections[0].dates);
                if (!date) continue;

                const timeArray = sections[0].getTimeRoom();
                if (!timeArray) continue;

                // don't include this combined section if it conflicts with any time filter or event.
                for (const td of timeSlots) {
                    if (checkTimeConflict(td, timeArray, 2, 3)) continue outer;
                }

                const secIndices: number[] = [];
                for (const section of sections) {
                    // filter out sections with unwanted status
                    if (this.options.status.includes(section.status)) continue;

                    secIndices.push(section.id);
                }

                if (secIndices.length) {
                    classes.push([key, secIndices]);
                    timeArrays.push(timeArray);
                    dates.push(date);
                }
            }

            // throw an error of none of the sections pass the filter
            if (classes.length === 0) {
                return {
                    level: 'error',
                    msg: `No sections of ${courseRec.department} ${courseRec.number} ${courseRec.type} satisfy your filters and do not conflict with your events`
                };
            }
            classList.push(classes);
            timeArrayList.push(timeArrays);
            dateList.push(dates);
        }
        const evaluator = this.createSchedule(
            classList,
            timeArrayList,
            dateList,
            schedule.events,
            refSchedule
        );
        const size = evaluator.size;
        if (size > 0) {
            if (sort) evaluator.sort();
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
     * @remarks The use of data structure assumes that
     * 1. Each course has no more than 255 sections
     * 2. Each section meets no more than 82 times in a week
     */
    public createSchedule(
        classList: RawAlgoCourse[][],
        timeArrayList: TimeArray[][],
        dateList: MeetingDate[][],
        events: Event[],
        refSchedule: ScheduleAll = {}
    ) {
        /**
         * current course index
         */
        let classNum = 0;
        /**
         * the index of the section of the course indicated by `classNum`
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
         * the max number of schedules to be generated
         */
        const { maxNumSchedules } = this.options;
        /**
         * the maximum number of sections in each course
         */
        const maxLen = Math.max(...classList.map(c => c.length));
        /**
         * the side length of the conflict cache matrix
         */
        const sideLen = maxLen * numCourses;

        // note: these are all Uint8Arrays so no byte alignment is needed
        let byteOffset =
            numCourses * 3 + // sectionLens + pathMemory + currentChoices
            maxLen * numCourses + // timeArrLens
            sideLen ** 2 + // conflictCache
            numCourses * maxNumSchedules; // allChoices
        const buffer = new ArrayBuffer(byteOffset);
        byteOffset = 0;

        const sectionLens = new Uint8Array(buffer, 0, numCourses);
        for (let i = 0; i < numCourses; i++) sectionLens[i] = classList[i].length;
        byteOffset += numCourses;
        /**
         * record the index of sections that are already tested
         */
        const pathMemory = new Uint8Array(buffer, byteOffset, numCourses);
        byteOffset += numCourses;
        /**
         * the choiceNum array corresponding to the currentSchedule
         */
        const currentChoices = new Uint8Array(buffer, byteOffset, numCourses);
        byteOffset += numCourses;
        /**
         * the cache of the length of TimeArray for each section
         * | Sections | Course1 | Course 2 | ... |
         * | -------- | ------- | -------- | --- |
         * | Sec1     | 14      | 14       |     |
         * | Sec2     | 14      | 17       |     |
         * ...
         * Columns are the courses
         */
        const timeArrLens = new Uint8Array(buffer, byteOffset, maxLen * numCourses);
        byteOffset += maxLen * numCourses;
        /**
         * the conflict cache matrix, a 4d tensor. Indexed like this:
         * ```js
         * conflictCache[section1][course1][section2][course2]
         * ```
         * which is in fact
         * ```js
         * conflictCache[(section1 * numCourses + course1) * sideLen + (section2 * numCourses + course2)]
         * ```
         */
        const conflictCache = new Uint8Array(buffer, byteOffset, sideLen ** 2);
        byteOffset += sideLen ** 2;
        /**
         * the array of `choiceNum`s.
         */
        const allChoices = new Uint8Array(buffer, byteOffset);

        // compute timeArrLens
        for (let i = 0; i < numCourses; i++) {
            const arrs = timeArrayList[i];
            const len = arrs.length;
            for (let j = 0; j < len; j++) {
                timeArrLens[j * numCourses + i] = arrs[j].length;
            }
        }

        // pre-compute the conflict between each pair of sections
        for (let i = 0; i < numCourses; i++) {
            for (let j = i + 1; j < numCourses; j++) {
                const arrs1 = timeArrayList[i],
                    arrs2 = timeArrayList[j],
                    dates1 = dateList[i],
                    dates2 = dateList[j],
                    len1 = arrs1.length,
                    len2 = arrs2.length;
                for (let m = 0; m < len1; m++) {
                    for (let n = 0; n < len2; n++) {
                        const i1 = m * numCourses + i, // courses are in the columns
                            i2 = n * numCourses + j;
                        // conflict is symmetric
                        conflictCache[i1 * sideLen + i2] = conflictCache[i2 * sideLen + i1] = +(
                            checkTimeConflict(arrs1[m], arrs2[n], 3, 3) &&
                            calcOverlap(dates1[m][0], dates1[m][1], dates2[n][0], dates2[n][1]) !==
                                -1
                        );
                    }
                }
            }
        }
        console.timeEnd('algorithm bootstrapping');
        console.time('running algorithm:');
        byteOffset = 0;
        // the main loop of the algorithm, made extremely efficient
        // by only operating on integers and typed integer arrays
        outer: while (true) {
            if (classNum >= numCourses) {
                const start = count * numCourses;
                // accumulate the length of the time arrays combined in each schedule
                byteOffset += 8;
                for (let i = 0; i < numCourses; i++)
                    // also assign currentChoices to allChoices
                    byteOffset +=
                        timeArrLens[(allChoices[start + i] = currentChoices[i]) * numCourses + i] -
                        8;

                if (++count >= maxNumSchedules) break outer;
                choiceNum = pathMemory[--classNum];
            }

            /**
             * when all possibilities in on class have exhausted, retract one class
             * explore the next possibilities in the nearest possible class
             * reset the memory path forward to zero
             */
            while (choiceNum >= sectionLens[classNum]) {
                // if all possibilities are exhausted, break out the loop
                if (--classNum < 0) break outer;

                choiceNum = pathMemory[classNum];
                for (let i = classNum + 1; i < numCourses; i++) pathMemory[i] = 0;
            }

            // check conflict between the newly chosen section and the sections already in the schedule
            for (let i = 0; i < classNum; i++) {
                if (
                    conflictCache[
                        (currentChoices[i] * numCourses + i) * sideLen +
                            choiceNum * numCourses +
                            classNum
                    ]
                ) {
                    ++choiceNum;
                    continue outer;
                }
            }

            // if the section does not conflict with any previously chosen sections,
            // increment the path memory and go to the next class, reset the choiceNum = 0
            currentChoices[classNum] = choiceNum;
            pathMemory[classNum++] = choiceNum + 1;
            choiceNum = 0;
        }
        console.timeEnd('running algorithm:');
        console.time('add to eval');

        /**
         * the buffer which stores the `offsets` and `blocks`
         */
        const buf = new ArrayBuffer(count * 4 + byteOffset * 2);
        /**
         * the cumulative length of the time arrays for each schedule
         */
        const offsets = new Uint32Array(buf, 0, count);
        /**
         * the array on which all `blocks` in the evaluator are allocated
         */
        const blocks = new Int16Array(buf, count * 4);
        byteOffset = 0;
        for (let i = 0; i < count; i++) {
            // record the current offset
            offsets[i] = byteOffset;
            // sort the time blocks in order
            byteOffset += sortBlocks(blocks, allChoices, timeArrayList, byteOffset, i);
        }
        console.timeEnd('add to eval');

        return new ScheduleEvaluator(
            this.options.sortOptions,
            window.timeMatrix,
            events,
            classList,
            offsets,
            blocks,
            allChoices.slice(0, count * numCourses), // only COPY the needed part,
            // to allow the underlying buffer of the original array to be garbage collected
            refSchedule
        );
    }
}

export default ScheduleGenerator;
