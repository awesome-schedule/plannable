/**
 * @module src/algorithm
 * @author Hanzhi Zhou, Zichao Hu, Kaiying Shan
 */

/**
 *
 */
import { CourseStatus } from '../config';
import Course from '../models/Course';
import Event from '../models/Event';
import GeneratedSchedule from '../models/GeneratedSchedule';
import ProposedSchedule from '../models/ProposedSchedule';
import { NotiMsg } from '../store/notification';
import { calcOverlap, parseDate } from '../utils';
import ScheduleEvaluator, { EvaluatorOptions } from './ScheduleEvaluator';

/**
 * The TimeArray is a condensed typed array storing
 * the time (and usually room index) information of the a schedule at each day.
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
 *   for (let j = timeArr[i]; j < timeArr[i+1]; j += 3) {
 *     const timeStart = timeArr[j],
 *           timeEnd   = timeArr[j+1],
 *           roomIdx   = timeArr[j+2];
 *     // do some processing
 *   }
 * }
 *
 * Note that the room information might be absent from the TimeArray, so instead of
 * using j += 3 in the inner loop, we might use j += 2 in some use cases.
 * ```
 */
export type TimeArray = [number[], number[], number[], number[], number[], number[], number[]];
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
 * return true if two [[TimeArray]] objects have overlapping time blocks, false otherwise
 * @param timeArray1
 * @param timeArray2
 * @param step1 the increment step for array 1
 * @param step2 the increment step for array 2
 * @note use step=2 for time only array, use step=3 for time-room combined array
 */
export function checkTimeConflict(
    timeArray1: TimeArray,
    timeArray2: TimeArray,
    step1 = 2,
    step2 = 2
) {
    for (let i = 0; i < 7; i++) {
        // skip the entire inner loop if needed
        const day1 = timeArray1[i],
            day2 = timeArray2[i];
        if (!day2.length) continue;

        for (let j = 0; j < day1.length; j += step1) {
            const begin1 = day1[j];
            const end1 = day1[j + 1];
            for (let k = 0; k < day2.length; k += step2)
                if (calcOverlap(begin1, end1, day2[k], day2[k + 1]) > 0) return true;
        }
    }
    return false;
}

/**
 * returns an array with all time arrays in `timeArrayList` concatenated together. The offsets
 * of time array of section `i` of course `j` is at `i * numCourse + j` position of the resulting array.
 */
export function timeArrayToCompact(timeArrays: TimeArray[][], maxSecLen: number) {
    const numCourses = timeArrays.length;
    const prefixLen = numCourses * maxSecLen * 8;
    let len = prefixLen;
    for (const course of timeArrays) {
        for (const sec of course) {
            for (const day of sec) {
                len += day.length;
            }
        }
    }
    const arr = new Uint16Array(len);
    len = 0;
    for (let i = 0; i < numCourses; i++) {
        for (let j = 0; j < timeArrays[i].length; j++) {
            for (let k = 0; k < 7; k++) {
                arr[i * maxSecLen * 8 + j * 8 + k] = len;
                const day = timeArrays[i][j][k];
                arr.set(day, len + prefixLen);
                len += day.length;
            }
            arr[i * maxSecLen * 8 + j * 8 + 7] = len;
        }
    }
    return arr;
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

        const msgs: NotiMsg<ScheduleEvaluator>[] = [];
        // for each course selected, form an array of sections
        for (const key in courses) {
            const temp = courses[key];
            const allSections = temp === -1 ? ([-1] as const) : temp;

            let noSelected = true;
            for (let i = 0; i < allSections.length; i++) {
                const subgroup = allSections[i];

                // ignore empty group
                if (subgroup instanceof Set && subgroup.size === 0) continue;

                const courseRec = this.catalog.getCourse(key, subgroup);

                const [classes, timeArrays, dates, allInvalid] = this.filterSections(
                    courseRec,
                    timeSlots
                );

                noSelected = false;
                // give an warning if none of the sections pass the filter
                if (classes.length === 0) {
                    msgs.push({
                        level: 'warn',
                        msg: `Not scheduled: ${courseRec.displayName}${
                            i === 0 || subgroup === -1 ? '' : ' belonging to group ' + i // don't show group idx for default group or Any Section
                        }. Reason: No sections satisfy your filters and do not conflict with your events`
                    });
                } else {
                    classList.push(classes);
                    timeArrayList.push(timeArrays);
                    dateList.push(dates);
                }
                if (allInvalid) {
                    msgs.push({
                        level: 'warn',
                        msg: `Warning: No sections of ${courseRec.displayName}${
                            i === 0 || subgroup === -1 ? '' : ' belonging to group ' + i // don't show group idx for default group or Any Section
                        } have valid meeting times (e.g. All TBA/TBD/Online Asynchronous). It will not be shown on the schedule grid.`
                    });
                }
            }
            if (noSelected) {
                return {
                    level: 'error',
                    msg: `No sections of ${
                        this.catalog.getCourse(key, -1).displayName
                    } are selected!`
                };
            }
        }

        const numCourses = classList.length;

        // cache for the number of sections in each course
        const sectionLens = new Uint8Array(numCourses);

        // the maximum number of sections in each course
        let maxLen = 0;
        for (let i = 0; i < numCourses; i++) {
            const len = (sectionLens[i] = classList[i].length);
            if (len > maxLen) maxLen = len;
        }

        // the side length of the conflict cache matrix
        const sideLen = maxLen * numCourses;

        /**
         * the conflict cache matrix, a 4d tensor. Indexed like this:
         * ```js
         * conflictCache[section1][course1][section2][course2]
         * // which is in fact
         * conflictCache[(section1 * numCourses + course1) * sideLen + (section2 * numCourses + course2)]
         * ```
         * @note can do bitpacking, but no performance improvement observed
         */
        const conflictCache = new Uint8Array(sideLen * sideLen);

        // prepare the conflictCache
        computeConflict(timeArrayList, dateList, conflictCache, sideLen);

        const { maxNumSchedules } = this.options;
        const compact = timeArrayToCompact(timeArrayList, maxLen);

        console.timeEnd('algorithm bootstrapping');

        console.time('running algorithm:');

        const Module = window.NativeModule;
        const secLenPtr = Module._malloc(sectionLens.byteLength);
        const conflictCachePtr = Module._malloc(conflictCache.byteLength);
        console.warn(sideLen);
        const timeArrayPtr = Module._malloc(compact.byteLength);

        Module.HEAPU8.set(sectionLens, secLenPtr);
        Module.HEAPU8.set(conflictCache, conflictCachePtr);
        Module.HEAP16.set(compact, timeArrayPtr / 2);
        Module._generate(numCourses, maxNumSchedules, secLenPtr, conflictCachePtr, timeArrayPtr);

        const evaluator = new ScheduleEvaluator(
            this.options.sortOptions,
            schedule.events,
            classList,
            refSchedule,
            window.NativeModule
        );

        console.timeEnd('running algorithm:');

        const size = evaluator.size;
        if (size > 0) {
            console.time('sort');
            if (sort) evaluator.sort();
            console.timeEnd('sort');

            let msgString = '';
            for (const msg of msgs) msgString += msg.msg + '<br>';
            return {
                level: msgs.length > 0 ? 'warn' : 'success',
                msg: `${msgString}${size} Schedules Generated!`,
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

        let allInvalid = true;
        // for each combined section, form a RawAlgoCourse
        outer: for (const sections of combined) {
            // only take the time and room info of the first section
            // time will be the same for sections in this array
            // but rooms..., well this is a compromise
            const date = parseDate(sections[0].dates);
            if (!date) continue;

            const timeArray = sections[0].getTimeRoom();
            if (timeArray.some(arr => arr.length > 0)) {
                allInvalid = false;

                // don't include this combined section if it conflicts with any time filter or event.
                for (const td of timeSlots) {
                    if (checkTimeConflict(td, timeArray, 2, 3)) continue outer;
                }
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

        return [classes, timeArrays, dates, allInvalid] as const;
    }
}

export default ScheduleGenerator;
