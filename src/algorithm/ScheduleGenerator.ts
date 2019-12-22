/**
 * @module algorithm
 * @author Hanzhi Zhou, Zichao Hu, Kaiying Cat
 */

/**
 *
 */
import GeneratedSchedule from '@/models/GeneratedSchedule';
import { CourseStatus } from '../models/Meta';
import { NotiMsg } from '../store/notification';
import Event from '../models/Event';
import ProposedSchedule from '../models/ProposedSchedule';
import { calcOverlap, checkTimeConflict, parseDate } from '../utils';
import ScheduleEvaluator, { EvaluatorOptions } from './ScheduleEvaluator';
import Course from '@/models/Course';

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

/**
 * returns an array with all time arrays in `timeArrayList` concatenated together. The offsets
 * of time array of section `i` of course `j` is at `i * numCourse + j` position of the resulting array.
 */
export function timeArrayToCompact(timeArrayList: TimeArray[][], timeArrLens: Uint8Array) {
    const len = timeArrLens.length;
    let offset = 0;
    for (let i = 0; i < len; i++) offset += timeArrLens[i];
    const compact = new Int32Array(len + offset);

    const numCourses = timeArrayList.length;
    offset = len;
    for (let i = 0; i < numCourses; i++) {
        const arr = timeArrayList[i];
        for (let j = 0; j < arr.length; j++) {
            compact[j * numCourses + i] = offset;
            const time = arr[j];
            let k = 0;
            for (; k < 8; k++) {
                compact[offset + k] = time[k] + offset; // add offset to the first 8 elements
            }
            for (; k < time.length; k++) {
                compact[offset + k] = time[k];
            }
            offset += time.length;
        }
    }
    return compact;
}

/**
 * record the length of `timeArrayList[crs][sec]` at `timeArrLens[sec * numCourses + crs]`,
 * exported for unit test purposes
 */
export function computeTimeArrLens(timeArrayList: TimeArray[][], timeArrLens: Uint8Array) {
    const numCourses = timeArrayList.length;
    for (let i = 0; i < numCourses; i++) {
        const arrs = timeArrayList[i];
        for (let j = 0; j < arrs.length; j++) {
            timeArrLens[j * numCourses + i] = arrs[j].length;
        }
    }
}

/**
 * pre-compute `conflictCache` using `timeArrayList` and `dateList`
 */
function computeConflict(
    timeArrayList: TimeArray[][],
    dateList: MeetingDate[][],
    conflictCache: Uint8Array,
    sideLen: number
) {
    const numCourses = timeArrayList.length;
    // pre-compute the conflict between each pair of sections
    for (let i = 0; i < numCourses; i++) {
        for (let j = i + 1; j < numCourses; j++) {
            const arrs1 = timeArrayList[i],
                arrs2 = timeArrayList[j],
                dates1 = dateList[i],
                dates2 = dateList[j];
            for (let m = 0; m < arrs1.length; m++) {
                for (let n = 0; n < arrs2.length; n++) {
                    const i1 = m * numCourses + i, // courses are in the columns
                        i2 = n * numCourses + j;
                    // conflict is symmetric
                    conflictCache[i1 * sideLen + i2] = conflictCache[i2 * sideLen + i1] = +(
                        checkTimeConflict(arrs1[m], arrs2[n], 3, 3) &&
                        calcOverlap(dates1[m][0], dates1[m][1], dates2[n][0], dates2[n][1]) !== -1
                    );
                }
            }
        }
    }
}

export interface GeneratorOptions {
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
        public readonly catalog: Window['catalog'],
        public readonly timeMatrix: Window['timeMatrix'],
        public readonly options: GeneratorOptions
    ) {}

    /**
     * The entrance of the schedule generator
     * @returns a sorted [[ScheduleEvaluator]] Object
     * @requires optimization
     * @remarks The use of data structure assumes that
     * 1. Each course has no more than 255 sections
     * 2. Each section meets no more than 82 times in a week
     */
    public getSchedules(
        schedule: ProposedSchedule,
        sort = true,
        refSchedule: GeneratedSchedule['All'] = {}
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
            const temp = courses[key];
            const allSections = temp === -1 ? ([-1] as const) : temp;

            for (const subgroup of allSections) {
                if (subgroup instanceof Set && subgroup.size === 0) continue;

                const courseRec = this.catalog.getCourse(key, subgroup);
                if (courseRec.sections.length === 0) {
                    return {
                        level: 'error',
                        msg: `No sections of ${courseRec.displayName} are selected!`
                    };
                }

                const [classes, timeArrays, dates] = this.filterSections(courseRec, timeSlots);
                // throw an error of none of the sections pass the filter
                if (classes.length === 0) {
                    return {
                        level: 'error',
                        msg: `No sections of ${courseRec.displayName} satisfy your filters and do not conflict with your events`
                    };
                }
                classList.push(classes);
                timeArrayList.push(timeArrays);
                dateList.push(dates);
            }
        }

        const numCourses = classList.length; // number of courses
        const maxLen = Math.max(...classList.map(c => c.length)); // the maximum number of sections in each course
        const sideLen = maxLen * numCourses; // the side length of the conflict cache matrix
        const buffer = new ArrayBuffer(
            numCourses + // sectionLens
            sideLen + // timeArrLens
                sideLen * sideLen // conflictCache
        );
        // cache for the number of sections in each course
        const sectionLens = new Uint8Array(buffer, 0, numCourses);
        for (let i = 0; i < numCourses; i++) sectionLens[i] = classList[i].length;
        /**
         * the cache of the length of TimeArray for each section.
         * ```js
         * len = timeArrLens[sectionIdx * numCourses + courseIdx]
         * ```
         */
        const timeArrLens = new Uint8Array(buffer, numCourses, maxLen * numCourses);
        /**
         * the conflict cache matrix, a 4d tensor. Indexed like this:
         * ```js
         * conflictCache[section1][course1][section2][course2]
         * // which is in fact
         * conflictCache[(section1 * numCourses + course1) * sideLen + (section2 * numCourses + course2)]
         * ```
         */
        const conflictCache = new Uint8Array(buffer, numCourses + sideLen, sideLen ** 2);

        computeTimeArrLens(timeArrayList, timeArrLens);

        computeConflict(timeArrayList, dateList, conflictCache, sideLen);

        const { maxNumSchedules } = this.options;
        // the array used to record all schedules generated
        const allChoices = new Uint8Array(numCourses * maxNumSchedules);
        console.timeEnd('algorithm bootstrapping');

        console.time('running algorithm:');
        const [count, timeLen] = this.computeSchedules(
            sectionLens,
            timeArrLens,
            conflictCache,
            allChoices,
            maxNumSchedules
        );
        console.timeEnd('running algorithm:');

        console.time('add to eval');
        const evaluator = new ScheduleEvaluator(
            this.options.sortOptions,
            this.timeMatrix,
            schedule.events,
            classList,
            allChoices,
            refSchedule,
            timeArrayToCompact(timeArrayList, timeArrLens),
            count,
            timeLen
        );
        const size = evaluator.size;
        if (size > 0) {
            console.timeEnd('add to eval');
            if (sort) evaluator.sort();
            return {
                level: 'success',
                msg: `${size} Schedules Generated!`,
                payload: evaluator
            };
        }
        console.timeEnd('add to eval');
        return {
            level: 'error',
            msg: 'Given your filter, we cannot generate schedules without overlapping classes'
        };
    }

    private filterSections(courseRec: Course, timeSlots: TimeArray[]) {
        const classes: RawAlgoCourse[] = [],
            timeArrays: TimeArray[] = [],
            dates: MeetingDate[] = [];

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
                classes.push([courseRec.key, secIndices]);
                timeArrays.push(timeArray);
                dates.push(date);
            }
        }

        return [classes, timeArrays, dates] as const;
    }

    /**
     * the main algorithm loop: generate all possible schedules based on the pre-computed information
     * @remarks this method does the most computation. It is made extremely efficient
     * by only operating on integers and typed integer arrays. Can be easily ported to C++
     * @returns [number of schedules generated, the length of time arrays of schedules in total]
     */
    private computeSchedules(
        sectionLens: Uint8Array,
        timeArrLens: Uint8Array,
        conflictCache: Uint8Array,
        allChoices: Uint8Array,
        maxNumSchedules: number
    ) {
        const numCourses = sectionLens.length;
        const sideLen = timeArrLens.length;

        const buffer = new ArrayBuffer(numCourses * 2);
        // record the index of sections that are already tested
        const pathMemory = new Uint8Array(buffer, 0, numCourses);
        // the choiceNum array corresponding to the currentSchedule
        const currentChoices = new Uint8Array(buffer, numCourses, numCourses);

        // the total length of the time array that we need to allocate for schedules generated
        let timeLen = 0;
        let classNum = 0; // current course index
        let choiceNum = 0; // the index of the section of the current course
        let count = 0; // the total number of schedules already generated

        outer: while (true) {
            if (classNum >= numCourses) {
                const start = count * numCourses;
                // accumulate the length of the time arrays combined in each schedule
                // also append currentChoices to allChoices
                for (let i = 0; i < numCourses; i++)
                    timeLen +=
                        timeArrLens[(allChoices[start + i] = currentChoices[i]) * numCourses + i];

                if (++count >= maxNumSchedules) break outer;
                choiceNum = pathMemory[--classNum];
            }

            /**
             * when all possibilities in on class have exhausted, retract one class
             * explore the next possibilities in the previous class
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
                        (choiceNum * numCourses + classNum) * sideLen +
                            currentChoices[i] * numCourses +
                            i
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
        return [count, timeLen - (numCourses - 1) * 8 * count] as const;
    }
}

export default ScheduleGenerator;
