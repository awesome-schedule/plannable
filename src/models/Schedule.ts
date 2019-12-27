/**
 * @author Hanzhi Zhou, Kaiying Shan
 * @module models
 */

/**
 *
 */
import { Vertex, intervalScheduling, colorDepthSearch } from '../algorithm/Graph';
import * as Utils from '../utils';
import Course from './Course';
import Event from './Event';
import Hashable from './Hashable';
import { Day, dayToInt } from './Meta';
import ScheduleBlock from './ScheduleBlock';
import Section from './Section';
import colorSchemes from '@/data/ColorSchemes';
import ProposedSchedule from './ProposedSchedule';

/**
 * the structure of a Section in local storage
 */
export interface SectionJSON {
    id: number;
    /**
     * This property is
     * - not present if parsed from URL,
     * - present if parsed from JSON
     */
    section?: string;
}

/**
 * represents all courses in a schedule, stored as `(key, set of sections)` pair
 *
 * Note that if **section** is -1, it means that all sections are allowed.
 * Otherwise, **section** should be a Set/array of object corresponding to each section
 *
 * @typeparam T the type of the container used for the set of sections.
 * By default, this is a set of numbers, corresponding to the `id` field of each section
 * @remarks This field is called `All` (yes, with the first letter capitalized) due to historical reasons
 */
export interface ScheduleAll<T = Set<number>[] | -1> {
    [courseKey: string]: T;
}

export interface ScheduleJSON {
    All: ScheduleAll<SectionJSON[][] | -1>;
    events: Event[];
}

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

    public All: ScheduleAll = {};
    /**
     * computed based on `this.All` by `computeSchedule`
     */
    public days: [
        ScheduleBlock[], // Monday
        ScheduleBlock[],
        ScheduleBlock[],
        ScheduleBlock[],
        ScheduleBlock[],
        ScheduleBlock[],
        ScheduleBlock[] // Sunday
    ] = [[], [], [], [], [], [], []];
    /**
     * total credits stored in this schedule, computed based on `this.All`
     */
    public totalCredit = 0;
    /**
     * a computed object that's updated by the `computeSchedule` method
     *
     * ids are the list of ids selected for a given course
     */
    public current: { courses: Course[]; ids: string[][] } = { courses: [], ids: [] };
    /**
     * keep track of used colors to avoid color collision
     */
    public colorSlots = Array.from({ length: Schedule.colors.length }, () => new Set<string>());
    /**
     * the `computeSchedule` handle returned by `setTimeout`
     */
    public pendingCompute = 0;

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
     * the index of the currently selected separator (in `dateSeparators`)
     */
    public dateSelector = -1;

    /**
     * the currently previewed (hovered) section
     */
    private _preview: Section | null = null;
    private separatedAll: { [date: string]: ScheduleAll } = {};

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
     * preview and remove preview need to use the async version of compute
     */
    public removePreview() {
        this._preview = null;
        this.computeSchedule(false);
    }

    public preview(section: Section) {
        this._preview = section;
        this.computeSchedule(false);
    }

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

    /**
     * Compute the schedule view based on `this.All` and `this.preview`.
     * If there is a pending compute task, remove that pending task.
     * @param sync if true, synchronously execute this function, otherwise use setTimeout
     * @param time the delay of setTimeout, in milliseconds
     * @remarks this method has a very high time complexity.
     * However, because we're running on small input sets (usually contain no more than 20 sections), it
     * usually completes within 50ms.
     */
    public computeSchedule(sync = true, time = 10) {
        window.clearTimeout(this.pendingCompute);
        if (sync) {
            console.time('compute schedule');
            this._computeSchedule();
            console.timeEnd('compute schedule');
        } else {
            this.pendingCompute = window.setTimeout(() => {
                this._computeSchedule();
            }, time);
        }
    }

    private _computeSchedule() {
        const catalog = window.catalog;
        if (!catalog) return;

        this.cleanSchedule();
        const temp = new Date(this.dateSeparators[this.dateSelector]);

        const all =
            this.dateSelector === -1 || this.dateSelector >= this.dateSeparators.length
                ? this.All
                : this.separatedAll[temp.getMonth() + 1 + '/' + temp.getDate()];

        const current: [Course, string[]][] = [];
        for (const key in all) {
            const temp = all[key];

            // combine all groups because groups don't affect display
            const sections =
                temp === -1
                    ? -1
                    : temp.reduce((acc, group) => {
                          group.forEach(x => acc.add(x));
                          return acc;
                      }, new Set<number>());

            // we need a full course record of key `key`
            const fullCourse = catalog.getCourse(key);
            // a "partial" course with only selected sections
            const course = catalog.getCourse(key, sections);
            // skip placing empty courses
            if (!course.sections.length) {
                current.push([fullCourse, [' - ']]);
                continue;
            }

            const credit = parseFloat(course.units);
            this.totalCredit += isNaN(credit) ? 0 : credit;
            // if any section
            if (sections === -1) {
                current.push([fullCourse, [' - ']]);
                this.place(course);
            } else {
                // only one section: place that section
                if (sections.size === 1) {
                    const sec = course.sections[0];
                    current.push([fullCourse, [sec.id.toString()]]);
                    this.place(sec);
                } else if (sections.size > 0) {
                    if (Schedule.multiSelect) {
                        // try to combine sections even if we're in multi-select mode
                        const combined = Object.values(course.getCombined()).map(secs =>
                            catalog.getCourse(course.key, new Set(secs.map(sec => sec.id)))
                        );
                        for (const crs of combined) this.place(crs);
                    } else {
                        // a subset of the sections
                        this.place(course);
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
            for (const blocks of this.days) {
                for (const block of blocks) {
                    if (!(block.section instanceof Event) && block.section.has(section))
                        found = block.strong = true;
                }
            }
            if (!found) this.place(section);
        }

        // sort currentCourses in alphabetical order
        current.sort((a, b) => -(a[0].key < b[0].key));
        this.current.courses = current.map(x => x[0]);
        this.current.ids = current.map(x => x[1]);

        for (const event of this.events) if (event.display) this.place(event);
        this.computeBlockPositions();
    }

    /**
     * need to be called before `computeSchedule` if the `All` property is updated.
     */
    public constructDateSeparator() {
        const sections: Section[] = [];

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
                if (section.dateArray) sections.push(section);
            }
        }

        const _temp = new Set<number>();
        for (const { dateArray } of sections)
            _temp.add(dateArray[0]).add(dateArray[1] + 24 * 60 * 60 * 1000);

        this.dateSeparators = [..._temp].sort((a, b) => a - b);

        // create empty objects for separated "All"
        this.separatedAll = Object.create(null);
        for (let i = 0; i < this.dateSeparators.length; i++) {
            const temp = new Date(this.dateSeparators[i]);
            this.separatedAll[temp.getMonth() + 1 + '/' + temp.getDate()] = {};
        }

        // add the section ids to the separated all
        for (let i = 0; i < this.dateSeparators.length; i++) {
            const lower = this.dateSeparators[i];
            const upper = i === 0 ? -1 : this.dateSeparators[i - 1];
            const sep = new Date(lower);
            const date = sep.getMonth() + 1 + '/' + sep.getDate();
            for (const key in this.All) {
                const course = this.All[key];
                if (course === -1) {
                    const sections = window.catalog.getCourse(key, -1);
                    for (const sec of sections.sections) {
                        const [start, end] = sec.dateArray;
                        if (start < lower && end >= upper) {
                            this.separatedAll[date][key] = -1;
                        }
                    }
                    continue;
                }
                // one set for each group
                for (const group of course) {
                    const sections = window.catalog.getCourse(key, group);
                    const s = new Set<number>();
                    for (const sec of sections.sections) {
                        const [start, end] = sec.dateArray;
                        if (start < lower && end >= upper) {
                            s.add(sec.id);
                        }
                    }
                    // if the **course** already exists in this time block
                    if (this.separatedAll[date][key]) {
                        (this.separatedAll[date][key] as Set<number>[]).push(s);
                    } else {
                        this.separatedAll[date][key] = [s];
                    }
                }
            }
        }
    }

    /**
     * for the array of schedule blocks provided, construct an adjacency list
     * to represent the conflicts between each pair of blocks
     */
    private constructAdjList(blocks: ScheduleBlock[]) {
        const len = blocks.length;
        const adjList: number[][] = blocks.map(() => []);

        // construct an undirected graph
        for (let i = 0; i < len; i++) {
            for (let j = i + 1; j < len; j++) {
                if (blocks[i].conflict(blocks[j])) {
                    adjList[i].push(j);
                    adjList[j].push(i);
                }
            }
        }
        return adjList;
    }

    /**
     * compute the width and left of the blocks contained in each day
     */
    public computeBlockPositions() {
        for (const blocks of this.days) {
            this._computeBlockPositions(blocks);
        }
    }

    /**
     * compute the width and left of the blocks passed in
     * @param blocks blocks belonging to the same connected component
     */
    private _computeBlockPositions(blocks: ScheduleBlock[]) {
        const colors = new Int16Array(blocks.length);
        const numColors = intervalScheduling(blocks, colors);
        const adjList = this.constructAdjList(blocks);

        // note: blocks are contained in nodes
        const graph = colorDepthSearch(adjList, colors, blocks);
        const slots: Vertex<ScheduleBlock>[][] = Array.from({ length: numColors }, () => []);
        for (const node of graph.keys()) {
            slots[node.depth].push(node);
            node.val.left = node.depth / node.pathDepth;
            node.val.width = 1 / node.pathDepth;
        }

        // auto-expansion
        // no need to expand for the first slot
        for (let i = 1; i < slots.length; i++) {
            const slot = slots[i];
            for (const node of slot) {
                // maximum left that the current block can possibly obtain
                let maxLeft = 0;
                const neighbors = graph.get(node)!;
                for (const v of neighbors) {
                    if (v.depth < node.depth) {
                        const { left, width } = v.val;
                        const newLeft = left + width;
                        if (newLeft >= maxLeft) {
                            maxLeft = newLeft;
                        }
                    }
                }
                // distribute deltas to remaining nodes
                const delta = (node.val.left - maxLeft) / (node.pathDepth - node.depth);
                if (delta <= 0) continue;
                node.val.left = maxLeft;
                node.val.width += delta;
            }
        }

        for (const [node, neighbors] of graph) {
            // minimum left of the block that has greater depth than the current block
            let minLeft = Infinity;
            for (const v of neighbors) {
                if (v.depth > node.depth) {
                    const left = v.val.left;
                    if (left < minLeft) minLeft = left;
                }
            }
            if (minLeft !== Infinity) {
                node.val.width = minLeft - node.val.left;
            }
        }
        graph.clear();
    }

    /**
     * place a `Section`/`Course`/`Event`/ into one of the `Mo` to `Su` array according to its `days` property
     * @remarks we can place a Course instance if all of its sections occur at the same time
     */
    private place(course: Section | Course | Event) {
        if (course instanceof Section) {
            const color = this.getColor(course);
            for (const meeting of course.meetings) {
                this.placeHelper(color, meeting.days, course);
            }
        } else if (course instanceof Event) {
            if (course.display) {
                this.placeHelper(this.getColor(course), course.days, course);
            }
        } else {
            if (!course.allSameTime()) return;
            const courseSec = course.sections;
            const firstSec = courseSec[0];
            // if only one section, just use the section rather than the section array
            if (courseSec.length === 1) {
                const color = this.getColor(firstSec);
                for (const meeting of firstSec.meetings)
                    this.placeHelper(color, meeting.days, firstSec);
            } else {
                if (Schedule.combineSections) {
                    const color = this.getColor(course);
                    for (const meeting of firstSec.meetings)
                        this.placeHelper(color, meeting.days, course);
                } else {
                    // if we don't combined the sections, we call place for each section
                    for (const section of courseSec) {
                        // note: sections belonging to the same course will have the same color
                        const color = this.getColor(section);
                        for (const meeting of section.meetings)
                            this.placeHelper(color, meeting.days, section);
                    }
                }
            }
        }
    }

    private placeHelper(color: string, dayTimes: string, events: Section | Course | Event) {
        const [days, start, , end] = dayTimes.split(' ');
        if (days && start && end) {
            const startMin = Utils.to24hr(start);
            const endMin = Utils.to24hr(end);
            // wait... start time equals end time?
            if (startMin === endMin) {
                console.warn('start time equals end time:', events, startMin, endMin);
                return;
            }
            for (let i = 0; i < days.length; i += 2) {
                const scheduleBlock = new ScheduleBlock(color, startMin, endMin, events);
                this.days[dayToInt[days.substr(i, 2) as Day]].push(scheduleBlock);
            }
        }
    }

    /**
     * clean the computed properties of the schedule. They can be recovered by calling the
     * `computeSchedule method`
     */
    public cleanSchedule() {
        this.days = [[], [], [], [], [], [], []];
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
                All[key] = sections.map(group =>
                    [...group].map(_id => {
                        const { id, section } = catalog.getSectionById(key, _id);
                        return { id, section };
                    })
                );
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
