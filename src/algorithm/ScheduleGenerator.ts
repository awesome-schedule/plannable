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
 * TODO: add description
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
 * of time array of section `i` of course `j` at day k is at `j * maxLen * 8 + i * 8 + k` position of the resulting array.
 */
function timeArrayToCompact(Module: EMModule, timeArrays: TimeArray[]) {
    const numSections = timeArrays.length;
    const prefixLen = numSections * 8;
    let len = prefixLen;
    for (const sec of timeArrays) {
        for (const day of sec) {
            len += day.length;
        }
    }
    const ptr = Module._malloc(len * 2);
    const arr = Module.HEAPU16.subarray(ptr / 2);
    len = 0;
    for (let i = 0; i < numSections; i++) {
        for (let k = 0; k < 7; k++) {
            arr[i * 8 + k] = len;
            const day = timeArrays[i][k];
            arr.set(day, len + prefixLen);
            len += day.length;
        }
        arr[i * 8 + 7] = len;
    }
    return ptr;
}

/**
 * pre-compute `conflictCache` using `timeArrayList` and `dateList`
 */
function computeConflict(
    timeArrayList: TimeArray[],
    dateList: MeetingDate[],
    conflictCache: Uint8Array
) {
    const numSections = timeArrayList.length;
    // pre-compute the conflict between each pair of sections
    for (let i = 0; i < numSections; i++) {
        for (let j = i + 1; j < numSections; j++) {
            // conflict is symmetric
            conflictCache[i * numSections + j] = conflictCache[j * numSections + i] = +(
                checkTimeConflict(timeArrayList[i], timeArrayList[j], 3, 3) &&
                calcOverlap(dateList[i][0], dateList[i][1], dateList[j][0], dateList[j][1]) !== -1
            );
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
     * @returns a [[ScheduleEvaluator]] Object
     */
    public getSchedules(
        schedule: ProposedSchedule,
        refSchedule: GeneratedSchedule['All'] = {}
    ): NotiMsg<ScheduleEvaluator> {
        console.time('algorithm bootstrapping');

        // convert events to TimeArrays so that we can easily check for time conflict
        const timeSlots: TimeArray[] = schedule.events.map(e => e.toTimeArray());
        for (const event of this.options.timeSlots) timeSlots.push(event.toTimeArray());

        const classList: RawAlgoCourse[] = [];
        const timeArrayList: TimeArray[] = [];
        const dateList: MeetingDate[] = [];

        const secLens = [0];
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
                    secLens.push(classes.length);
                    classList.push(...classes);
                    timeArrayList.push(...timeArrays);
                    dateList.push(...dates);
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

        if (classList.length === 0) {
            return {
                level: 'error',
                msg: 'Given your filter, we cannot generate schedules without overlapping classes'
            };
        }
        // change to prefix array
        for (let i = 1; i < secLens.length; i++) {
            secLens[i] += secLens[i - 1];
        }
        const Module = window.NativeModule;

        // pointer to the cache for the number of sections in each course
        const secLenPtr = Module._malloc(secLens.length * 4);
        Module.HEAP32.set(secLens, secLenPtr / 4);

        // the side length of the conflict cache matrix
        const _size = classList.length ** 2;
        const conflictCachePtr = Module._malloc(_size);

        // prepare the conflictCache
        computeConflict(
            timeArrayList,
            dateList,
            Module.HEAPU8.subarray(conflictCachePtr, conflictCachePtr + _size)
        );

        console.log(Array.from(Module.HEAPU8.subarray(conflictCachePtr, conflictCachePtr + _size)));
        console.log(classList);
        console.log(secLens);

        console.timeEnd('algorithm bootstrapping');

        console.time('running algorithm:');
        const size = Module._generate(
            secLens.length - 1,
            this.options.maxNumSchedules,
            secLenPtr,
            conflictCachePtr,
            timeArrayToCompact(Module, timeArrayList)
        );
        console.timeEnd('running algorithm:');

        if (size < 0)
            return {
                level: 'error',
                msg: 'Out of memory! Please try to reduce the max number of schedules'
            };
        if (size === 0)
            return {
                level: 'error',
                msg: 'Given your filter, we cannot generate schedules without overlapping classes'
            };

        const evaluator = new ScheduleEvaluator(
            this.options.sortOptions,
            schedule.events,
            classList,
            secLens,
            refSchedule,
            window.NativeModule
        );

        console.time('sort');
        evaluator.sort();
        console.timeEnd('sort');

        let msgString = '';
        for (const msg of msgs) msgString += msg.msg + '<br>';
        return {
            level: msgs.length > 0 ? 'warn' : 'success',
            msg: `${msgString}${size} Schedules Generated!`,
            payload: evaluator
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
