/**
 * @author Hanzhi Zhou, Kaiying Shan
 * @module src/models
 */

/**
 *
 */
import * as Utils from '../utils';
import Course from './Course';
import Event from './Event';
import Hashable from './Hashable';
import ScheduleBlock from './ScheduleBlock';
import Section from './Section';
import colorSchemes from '@/data/ColorSchemes';
import ProposedSchedule from './ProposedSchedule';
import { computeBlockPositions } from '@/algorithm/Renderer';
import { dayToInt, Day } from './constants';
import Meeting from './Meeting';
import { calcOverlap } from '../utils';
import { MeetingDate } from '@/algorithm/ScheduleGenerator';

/**
 * the structure of a [[Section]] in local storage
 */
export interface SectionJSON {
    /** @see [[Section.id]] */
    id: number;
    /**
     * This property is
     * - not present if parsed from URL,
     * - present if parsed from JSON
     */
    section?: string;
}

/**
 * represents all courses in a schedule, usually stored as `(key, array of set of sections)` pair
 *
 * If **section** is -1, it means that all sections are allowed.
 * Otherwise, **section** should be an array of groups, and each group should be an array/set of sections
 *
 * @typeparam T the type of the container used for the set of sections.
 * By default, this is a array of set of numbers, corresponding to the `id` field of each section
 * @remarks This field is called `All` (yes, with the first letter capitalized) due to historical reasons
 */
export interface ScheduleAll<T = Set<number>[] | -1> {
    [courseKey: string]: T;
}

/**
 * the representation of a [[Schedule]] in local storage
 */
export interface ScheduleJSON {
    All: ScheduleAll<SectionJSON[][] | -1>;
    events: Event[];
}

export type ScheduleDays = [
    ScheduleBlock[], // Monday
    ScheduleBlock[],
    ScheduleBlock[],
    ScheduleBlock[],
    ScheduleBlock[],
    ScheduleBlock[],
    ScheduleBlock[] // Sunday
];

/**
 * Schedule handles the storage, access, mutation and render of courses and events.
 * @requires window.catalog
 */
export default abstract class Schedule {
    // ----------------- global schedule options ------------------
    public static combineSections = true;
    public static multiSelect = true;
    public static savedColors: { [key: string]: string } = {};
    public static colors: readonly string[] = colorSchemes[0].colors;
    // ------------------- end schedule options -------------------

    public static compressJSON(obj: ScheduleJSON) {
        const { All, events } = obj;
        const shortAll: ScheduleAll<number[][] | -1> = {};
        for (const key in All) {
            const sections = All[key];
            shortAll[key] =
                sections === -1 ? sections : sections.map(group => group.map(({ id }) => id));
        }
        return [shortAll, ...events.map(e => Event.prototype.toJSONShort.call(e))] as const;
    }

    public static decompressJSON(obj: ReturnType<typeof Schedule.compressJSON>): ScheduleJSON {
        const All: ScheduleJSON['All'] = {};
        const [shortAll, ...events] = obj;
        for (const key in shortAll) {
            const entry = shortAll[key];
            All[key] =
                entry instanceof Array ? entry.map(group => group.map(id => ({ id }))) : entry;
        }
        return {
            All,
            events: events.map(e => Event.fromJSONShort(e))
        };
    }

    /**
     * @see [[ScheduleAll]]
     */
    public All: ScheduleAll = {};
    /**
     * computed based on `this.All` by `computeSchedule`
     */
    public days: ScheduleDays = [[], [], [], [], [], [], []];
    /**
     * total credits stored in this schedule, computed based on `this.All`
     */
    public totalCredit = 0;
    /**
     * a computed object that's updated by the `computeSchedule` method,
     * used by [[ClassList]] for rendering purposes
     *
     * - courses contain **all** sections (not just those selected by user)
     * - ids are the list of ids selected for a given course
     */
    public current: { courses: Course[]; ids: string[][] } = { courses: [], ids: [] };
    /**
     * keep track of used colors to avoid color collision
     */
    public colorSlots = Array.from({ length: Schedule.colors.length }, () => new Set<string>());
    /**
     * the index of the currently selected separator (in `dateSeparators`)
     */
    public dateSelector = -1;

    /**
     * the currently previewed (hovered) section
     */
    private _preview: Section | null = null;

    /**
     * the `computeSchedule` handle returned by `setTimeout`
     */
    private pendingCompute = 0;
    /**
     * The separator of sections in different time periods,
     * representing different end times of sections. Elements are dates in milliseconds
     * Example:
     * ```js
     * [1567457860885, 1567458860885]
     * ```
     */
    public dateSeparators: number[] = [];

    /**
     * Construct a `Schedule` object from its raw representation
     */
    constructor(raw: ScheduleAll = {}, public events: Event[] = []) {
        this.All = raw;
        if (!this.empty()) {
            this.constructDateSeparator();
            this.computeSchedule();
        }
    }

    public abstract update(key: string, section: number, group?: number, remove?: boolean): void;
    public abstract remove(key: string): void;

    // abstracting the copy() method is to prevent circular dependency
    public abstract copy(deepCopyEvent?: boolean): ProposedSchedule;

    protected _copy() {
        const AllCopy: ScheduleAll = {};
        for (const key in this.All) {
            const sections = this.All[key];
            if (sections instanceof Array) {
                AllCopy[key] = sections.map(s => new Set(s));
            } else {
                AllCopy[key] = sections;
            }
        }
        return AllCopy;
    }

    /**
     * Get the background color of a hashable object
     * Usually the object is either a `Course`, a `Section`, or an `Event`
     *
     * @remarks color collision is handled by separate chaining
     */
    private getColor(obj: Hashable): string {
        const userColor = Schedule.savedColors[obj.key];
        if (userColor) return userColor;

        const colors = Schedule.colors;
        const idx = obj.hash() % colors.length;
        this.colorSlots[idx].add(obj.key);
        return colors[idx];
    }

    /**
     * temporarily add a new section to the schedule
     * need to re-render the schedule
     */
    public preview(section: Section) {
        this._preview = section;
        this.computeSchedule(false);
    }

    public removePreview() {
        this._preview = null;
        this.computeSchedule(false);
    }

    /**
     * highlight a course, if it exists on the schedule
     * no re-render is needed.
     */
    public hover(key: string, strong = true) {
        for (const blocks of this.days) {
            for (const block of blocks) {
                if (block.section.key === key) block.strong = strong;
            }
        }
    }

    public unhover(key: string) {
        this.hover(key, false);
    }

    public cancelCompute() {
        window.clearTimeout(this.pendingCompute);
    }

    /**
     * Compute the schedule view based on `this.All` and `this.preview`.
     * If there is a pending compute task, remove that pending task.
     * @param sync if true, synchronously execute this function, otherwise use setTimeout
     * @param time the delay of setTimeout, in milliseconds
     * @remarks this method has a very high time complexity.
     * However, because we're running on small input sets (usually contain no more than 20 sections), it usually completes within 50ms.
     * @note it is the caller's responsibility to call constructDateSeparators, which is necessary if new classes are added
     */
    public computeSchedule(sync = true, time = 100) {
        this.cancelCompute();
        if (sync) {
            this._computeSchedule();
        } else {
            this.pendingCompute = window.setTimeout(() => {
                this._computeSchedule();
            }, time);
        }
    }

    private _computeSchedule() {
        const catalog = window.catalog;
        if (!catalog) return;

        this.cleanSchedule(false);
        // we will not clean schedule blocks in this.days and place on it directly.
        // Instead, we created a fresh object, and assign to this.days after blocks have been computed
        // so there will not be a period in which no blocks are in this.days
        const days: Schedule['days'] = [[], [], [], [], [], [], []];

        const current: [Course, string[]][] = [];
        for (const key in this.All) {
            const temp = this.All[key];

            // we need a full course record of key `key`
            const fullCourse = catalog.getCourse(key);
            const _creditStr = parseFloat(fullCourse.units);
            const credit = isNaN(_creditStr) ? 0 : _creditStr;
            // combine all groups because groups don't affect display
            const sections =
                temp === -1
                    ? ((this.totalCredit += credit), -1) // add credit once if 'Any Section'
                    : temp.reduce((acc, group) => {
                          if (group.size) {
                              group.forEach(x => acc.add(x));
                              // since we select one section from each group, we need to accumulate credit for each group
                              this.totalCredit += credit;
                          }
                          return acc;
                      }, new Set<number>());

            // a "partial" course with only selected sections
            const course = catalog.getCourse(key, sections);
            // skip placing empty courses (any section or no sections are selected)
            if (!course.sections.length) {
                current.push([fullCourse, [' - ']]);
                continue;
            }
            // if any section
            if (sections === -1) {
                current.push([fullCourse, [' - ']]);
                this.place(course, days);
            } else {
                // only one section: place that section
                if (sections.size === 1) {
                    const sec = course.sections[0];
                    current.push([fullCourse, [sec.id.toString()]]);
                    this.place(sec, days);
                } else if (sections.size > 0) {
                    if (Schedule.multiSelect) {
                        // try to combine sections even if we're in multi-select mode
                        const combined = Object.values(course.getCombined()).map(secs =>
                            catalog.getCourse(
                                course.key,
                                secs.map(sec => sec.id)
                            )
                        );
                        for (const crs of combined) this.place(crs, days);
                    } else {
                        // a subset of the sections
                        this.place(course, days);
                    }
                    current.push([fullCourse, course.sections.map(sec => sec.id.toString())]);
                }
            }
        }

        if (this._preview) {
            const section = this._preview;

            // do not place into the schedule if the section is already rendered
            // instead, we highlight the schedule
            let found = false;
            for (const blocks of days) {
                for (const block of blocks) {
                    if (block.section.has(section)) found = block.strong = true;
                }
            }
            if (!found) this.place(section, days);
        }

        // sort currentCourses in alphabetical order
        current.sort((a, b) => -(a[0].key < b[0].key));
        this.current.courses = current.map(x => x[0]);
        this.current.ids = current.map(x => x[1]);

        for (const event of this.events) if (event.display) this.place(event, days);

        // const tStart = performance.now();
        computeBlockPositions(days);
        // console.log('compute blocks', performance.now() - tStart);

        const totalBlocks = days.reduce((sum, blocks) => sum + blocks.length, 0);
        if (totalBlocks < 200) this.days = days;
        // disable reactivity for large schedules
        else if (totalBlocks < 2500 * 7) this.days = Object.seal(days);
        else {
            this.days = [[], [], [], [], [], [], []];
            console.warn('not rendered!');
        }
    }

    /**
     * need to be called before `computeSchedule` if the `All` property is updated.
     */
    public constructDateSeparator() {
        const dates: MeetingDate[] = [];

        for (const key in this.All) {
            const temp = this.All[key];

            // combine sections from different group
            const all =
                temp instanceof Array
                    ? temp.reduce((acc, x) => {
                          for (const v of x) acc.add(v);
                          return acc;
                      }, new Set<number>())
                    : -1;

            const course = window.catalog.getCourse(key, all);
            for (const section of course.sections) {
                // also make sure that all meetings of this section are not TBA
                if (section.dateArray && (section.valid & 0b100) === 0)
                    dates.push(section.dateArray);
            }
        }

        this.constructDateSeparatorFromDateList(dates);
    }

    public constructDateSeparatorFromDateList(dates: MeetingDate[]) {
        const _temp = new Set<number>();
        for (const date of dates) _temp.add(date![0]).add(date![1] + 24 * 60 * 60 * 1000);

        this.dateSeparators = [..._temp].sort((a, b) => a - b);
        if (this.dateSelector >= this.dateSeparators.length) this.dateSelector = -1;
    }

    /**
     * check if the section should be rendered given the current dataSelector
     * @param section
     */
    public checkDate(dateArray?: MeetingDate) {
        if (!dateArray) return true;

        const [start, end] = dateArray;
        if (
            this.dateSelector !== -1 &&
            calcOverlap(
                this.dateSeparators[this.dateSelector],
                this.dateSeparators[this.dateSelector + 1],
                start,
                end
            ) <= 0
        )
            return false;
        return true;
    }

    /**
     * place a `Section`/`Course`/`Event`/ into one of the days array according to its `days` property
     * @remarks we can place a Course instance if all of its sections occur at the same time
     */
    private place(course: Section | Course | Event, days: ScheduleDays) {
        if (course instanceof Section) {
            if (!this.checkDate(course.dateArray)) return;
            const color = this.getColor(course);
            for (const meeting of course.meetings) {
                this.placeHelper(color, days, course, meeting, course.dateArray);
            }
        } else if (course instanceof Event) {
            if (course.display) {
                this.placeHelper(this.getColor(course), days, course, undefined);
            }
        } else {
            if (!course.allSameTime()) return;
            const courseSec = course.sections;
            const firstSec = courseSec[0];
            if (!this.checkDate(firstSec.dateArray)) return;

            // if only one section, just use the section rather than the section array
            if (courseSec.length === 1) {
                const color = this.getColor(firstSec);
                for (const meeting of firstSec.meetings)
                    this.placeHelper(color, days, firstSec, meeting, firstSec.dateArray);
            } else {
                if (Schedule.combineSections) {
                    const color = this.getColor(course);
                    for (const meeting of firstSec.meetings)
                        this.placeHelper(color, days, course, meeting, firstSec.dateArray);
                } else {
                    // if we don't combined the sections, we call place for each section
                    for (const section of courseSec) {
                        // note: sections belonging to the same course will have the same color
                        const color = this.getColor(section);
                        for (const meeting of section.meetings)
                            this.placeHelper(color, days, section, meeting, section.dateArray);
                    }
                }
            }
        }
    }

    private placeHelper<T extends Section | Course | Event>(
        color: string,
        days: ScheduleDays,
        events: T,
        meeting: T extends Event ? undefined : Meeting,
        dateArray?: MeetingDate
    ) {
        const dayTimes = events instanceof Event ? events.days : meeting!.days;
        // const dayTimes = events instanceof
        const [daysStr, start, , end] = dayTimes.split(' ');
        if (daysStr && start && end) {
            const startMin = Utils.hr12toInt(start);
            const endMin = Utils.hr12toInt(end);
            // wait... start time equals end time?
            if (startMin === endMin) {
                console.warn('start time equals end time:', events, start, end);
                return;
            }
            for (let i = 0; i < daysStr.length; i += 2) {
                days[dayToInt[daysStr.substr(i, 2) as Day]].push(
                    new ScheduleBlock(color, startMin, endMin, events, meeting, dateArray)
                );
            }
        }
    }

    /**
     * clean the computed properties of the schedule. They can be recovered by calling the
     * `computeSchedule method`
     */
    public cleanSchedule(cleanDays = true) {
        if (cleanDays) this.days = [[], [], [], [], [], [], []];

        this.colorSlots = Array.from({ length: Schedule.colors.length }, () => new Set());
        this.totalCredit = 0;
        this.current.ids = [];
        this.current.courses = [];
    }

    /**
     * Serialize `this` to JSON
     */
    public toJSON(): ScheduleJSON {
        const All: ScheduleJSON['All'] = {};
        const catalog = window.catalog;
        // convert set to array
        for (const key in this.All) {
            const sections = this.All[key];
            if (sections instanceof Array) {
                All[key] = sections.map(group => {
                    const ids = [];
                    for (const _id of group) {
                        const { id, section } = catalog.getSectionById(_id);
                        ids.push({ id, section });
                    }
                    return ids;
                });
            } else All[key] = sections;
        }
        return {
            All,
            events: this.events
        };
    }

    /**
     * Check whether the given key exists in the Schedule.
     * @param key
     * @param rendered (default to true)
     * if true, only returns true if the course/event with the given key is rendered
     */
    public has(key: string, rendered = true) {
        if (rendered)
            return (
                this.events.some(x => x.days === key) ||
                this.days.some(blocks => blocks.some(block => block.section.key === key))
            );
        else return key in this.All || this.events.some(x => x.days === key);
    }

    /**
     * returns whether a given section exists in this schedule (All)
     */
    public hasSection(key: string, section: number) {
        const s = this.All[key];
        return s instanceof Array && s.findIndex(g => g.has(section)) !== -1;
    }

    /**
     * @returns true if none of the sections of this course is selected
     */
    public isCourseEmpty(key: string) {
        const s = this.All[key];
        return s instanceof Array && s.every(g => g.size === 0);
    }

    /**
     * @returns whether some of the sections selected corresponding to the given course key have invalid meeting time
     */
    public isSomeTBD(key: string) {
        const s = this.All[key];
        if (!(s instanceof Array)) return false;
        if (s.length === 0) return false;

        const merged = new Set(s[0]);
        for (let i = 1; i < s.length; i++) {
            for (const v of s[i]) {
                merged.add(v);
            }
        }
        return window.catalog.getCourse(key, merged).sections.some(s => s.isTBD());
    }

    /**
     * @returns whether the given course has `Any Section` selected
     */
    public isAnySection(key: string) {
        return this.All[key] === -1;
    }

    /**
     * @returns the group index corresponding to the given section
     */
    public getSectionGroup(key: string, section: number) {
        const sections = this.All[key];
        if (sections === -1 || !(sections instanceof Array)) return -1;
        return sections.findIndex(s => s.has(section));
    }

    /**
     * whether multiple groups exist for a given course
     * @param key
     */
    public isGroup(key: string) {
        const s = this.All[key];
        return s instanceof Array && s.length > 1;
    }

    /**
     * combine all groups
     */
    public ungroup(key: string) {
        const s = this.All[key];
        if (s instanceof Array && s.length > 1) {
            const first = s[0];
            // merge all groups into the first group
            for (let i = 1; i < s.length; i++) {
                for (const v of s[i]) {
                    first.add(v);
                }
            }
            s.splice(1);
            this.constructDateSeparator();
            this.computeSchedule();
        }
    }

    public clean() {
        this.cleanSchedule();
        this.All = {};
        this._preview = null;
        this.events = [];
        this.constructDateSeparator();
    }

    public empty() {
        return Object.keys(this.All).length === 0 && this.events.length === 0;
    }

    public equals(s: Schedule) {
        const days1 = this.events.map(x => x.days).sort();
        const days2 = s.events.map(x => x.days).sort();
        if (days1.length !== days2.length) return false;
        for (let i = 0; i < days1.length; i++) if (days1[i] !== days2[i]) return false;

        return this.allEquals(s.All);
    }

    /**
     * returns if an "All" equals to another
     * @param b another "All"
     */
    public allEquals(b: ScheduleAll) {
        const a = this.All;
        const keys = Object.keys(a);
        // unequal length
        if (keys.length !== Object.keys(b).length) return false;
        for (const key of keys) {
            const val1 = a[key],
                val2 = b[key];
            if (!val2) return false;
            // unequal value
            if (val1 === -1 || val2 === -1) {
                if (val1 !== val2) return false;
            } else {
                if (val1.length !== val2.length) return false;
                for (let i = 0; i < val1.length; i++) {
                    let bigFlag = false;
                    for (let j = 0; j < val2.length; j++) {
                        const v1 = val1[i];
                        const v2 = val2[j];
                        let flag = true;
                        for (const v of v1)
                            if (!v2.has(v)) {
                                flag = false;
                                break;
                            }
                        if (flag) {
                            bigFlag = true;
                            break;
                        }
                    }
                    if (!bigFlag) return false;
                }
            }
        }

        return true;
    }
}
