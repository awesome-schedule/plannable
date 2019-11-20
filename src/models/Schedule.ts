/**
 * @author Hanzhi Zhou, Kaiying Shan
 * @module models
 */

/**
 *
 */
import { NotiMsg } from '@/store/notification';
import { colorDepthSearch, DFS, Vertex, intervalScheduling } from '../algorithm';
import { RawAlgoCourse } from '../algorithm/ScheduleGenerator';
import * as Utils from '../utils';
import Course from './Course';
import Event from './Event';
import Hashable from './Hashable';
import { Day, dayToInt, TYPES, DAYS } from './Meta';
import ScheduleBlock from './ScheduleBlock';
import Section from './Section';
import colorSchemes from '@/data/ColorSchemes';

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
 * @remarks This field is called `All` (yes, with the first letter capitalized) since the very beginning
 */
export interface ScheduleAll<T = Set<number>> {
    [courseKey: string]: T | -1;
}

export interface ScheduleJSON {
    All: ScheduleAll<SectionJSON[]>;
    events: Event[];
}

/**
 * Schedule handles the storage, access, mutation and render of courses and events.
 * @requires window.catalog
 */
export default class Schedule {
    // ----------------- global schedule options ------------------
    public static combineSections = true;
    public static multiSelect = true;
    public static savedColors: { [key: string]: string } = {};
    public static colors: readonly string[] = colorSchemes[0].colors;
    // ------------------- end schedule options -------------------

    public static compressJSON(obj: ScheduleJSON) {
        const { All, events } = obj;
        const shortAll: ScheduleAll<number[]> = {};
        for (const key in All) {
            const sections = All[key];
            shortAll[key] =
                sections === -1
                    ? sections
                    : sections.reduce<number[]>((acc, { id }) => {
                          // only record ids, omit sections
                          acc.push(id);
                          return acc;
                      }, []);
        }
        return [shortAll, ...events.map(e => Event.prototype.toJSONShort.call(e))] as const;
    }

    public static decompressJSON(obj: ReturnType<typeof Schedule.compressJSON>): ScheduleJSON {
        const All: ScheduleAll<SectionJSON[]> = {};
        const [shortAll, ...events] = obj;
        for (const key in shortAll) {
            const entry = shortAll[key];
            All[key] = entry instanceof Array ? entry.map(e => ({ id: e })) : entry;
        }
        return {
            All,
            events: events.map(e => Event.fromJSONShort(e))
        };
    }

    /**
     * instantiate a `Schedule` object from its JSON representation.
     * the `computeSchedule` method will be invoked after instantiation
     *
     * @returns NotiMsg, whose level might be one of the following
     * 1. success: a schedule is successfully parsed from the JSON object
     * 2. warn: a schedule is successfully parsed, but some of the courses/sections recorded no longer exist
     * in the catalog
     * 3. error: the object passed in is falsy
     */
    public static fromJSON(obj?: ScheduleJSON): NotiMsg<Schedule> {
        if (!obj)
            return {
                level: 'error',
                msg: 'Invalid object'
            };
        const schedule = new Schedule();
        if (obj.events)
            schedule.events = obj.events.map(x =>
                x instanceof Event ? x : Object.setPrototypeOf(x, Event.prototype)
            );

        const keys = Object.keys(obj.All).map(x => x.toLowerCase());
        if (keys.length === 0)
            return {
                level: 'success',
                msg: 'Empty schedule',
                payload: schedule
            };

        const warnings = [];
        const catalog = window.catalog;
        const regex = /([a-z]{1,5})([0-9]{1,5})([0-9])$/i;
        // convert array to set
        for (const key of keys) {
            const sections = obj.All[key];
            const course = catalog.getCourse(key);
            const parts = key.match(regex);

            // converted key
            let convKey = key;
            if (parts && parts.length === 4) {
                parts[3] = TYPES[+parts[3] as 1];
                parts[1] = parts[1].toUpperCase();
                convKey = parts.slice(1).join(' ');
            }
            // non existent course
            if (!course) {
                warnings.push(`${convKey} does not exist anymore! It probably has been removed!`);
                continue;
            }
            const allSections = course.sections;
            if (sections instanceof Array) {
                if (!sections.length) {
                    schedule.All[key] = new Set();
                } else {
                    // backward compatibility for version prior to v5.0 (inclusive)
                    if (Utils.isNumberArray(sections)) {
                        const secs = sections as number[];
                        schedule.All[key] = new Set(
                            secs
                                .filter(sid => {
                                    // sid >= length possibly implies that section is removed from SIS
                                    if (sid >= allSections.length) {
                                        warnings.push(
                                            `Invalid section id ${sid} for ${convKey}. It probably has been removed!`
                                        );
                                    }
                                    return sid < allSections.length;
                                })
                                .map(idx => allSections[idx].id)
                        );
                    } else {
                        const set = new Set<number>();
                        for (const record of sections) {
                            // check whether the identifier of stored sections match with the existing sections
                            const target =
                                typeof record.section === 'undefined' // "section" property may not be recorded
                                    ? allSections.find(sec => sec.id === record.id) // in that case we only compare id
                                    : allSections.find(
                                          sec =>
                                              sec.id === record.id && sec.section === record.section
                                      );
                            if (target) set.add(target.id);
                            // if not exist, it possibly means that section is removed from SIS
                            else
                                warnings.push(
                                    `Section ${record.section} of ${convKey} does not exist anymore! It probably has been removed!`
                                );
                        }
                        schedule.All[key] = set;
                    }
                }
            } else {
                schedule.All[key] = sections;
            }
        }
        if (warnings.length) {
            return {
                level: 'warn',
                payload: schedule,
                msg: warnings.join('<br>')
            };
        } else {
            return {
                level: 'success',
                payload: schedule,
                msg: 'Success'
            };
        }
    }

    public All: ScheduleAll;
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
    ];
    /**
     * total credits stored in this schedule, computed based on `this.All`
     */
    public totalCredit: number;
    /**
     * a computed object that's updated by the `computeSchedule` method
     *
     * ids are the list of ids selected for a given course
     */
    public current: { courses: Course[]; ids: string[][] };
    /**
     * keep track of used colors to avoid color collision
     */
    public colorSlots: Set<string>[];
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
    private _preview: Section | null;
    private separatedAll: { [date: string]: ScheduleAll } = {};

    /**
     * Construct a `Schedule` object from its raw representation
     */
    constructor(raw: RawAlgoCourse[] | ScheduleAll = [], public events: Event[] = []) {
        this.All = {};
        this.days = [[], [], [], [], [], [], []];
        this._preview = null;
        this.colorSlots = Array.from({ length: Schedule.colors.length }, () => new Set<string>());
        this.totalCredit = 0;
        this.current = { courses: [], ids: [] };
        if (raw instanceof Array) {
            for (const [key, sections] of raw) {
                this.All[key] = new Set(sections);
            }
        } else {
            this.All = raw;
        }
        if (!this.empty()) {
            this.constructDateSeparator();
            this.computeSchedule();
        }
    }

    /**
     * Get the background color of a hashable object
     * Usually the object is either a `Course`, a `Section`, or an `Event`
     *
     * @remarks color collision is handled by separate chaining
     */
    public getColor(obj: Hashable): string {
        const userColor = Schedule.savedColors[obj.key];
        if (userColor) return userColor;

        const colors = Schedule.colors;
        const idx = obj.hash() % colors.length;
        this.colorSlots[idx].add(obj.key);
        return colors[idx];
    }

    /**
     * Update a section in the schedule
     * - If the section is **already in** the schedule, delete it from the schedule
     * - If the section is **not** in the schedule, add it to the schedule
     * @param remove whether to remove the key if the set of sections is empty
     */
    public update(key: string, section: number, remove = true) {
        if (section === -1) {
            if (this.All[key] === -1) {
                if (remove) delete this.All[key];
                // empty set if remove is false
                else this.All[key] = new Set();
            } else this.All[key] = -1;
        } else {
            const sections = this.All[key];
            if (sections instanceof Set) {
                if (sections.delete(section)) {
                    if (sections.size === 0 && remove) delete this.All[key];
                } else {
                    sections.add(section);
                }
            } else {
                this.All[key] = new Set([section]);
            }
        }
        this.constructDateSeparator();
        this.computeSchedule();
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

    /**
     * add an event to this schedule
     * @throws error if an existing event conflicts with this event
     */
    public addEvent(
        days: string,
        display: boolean,
        title?: string,
        room?: string,
        description?: string
    ) {
        for (const e of this.events) {
            if (e.days === days) {
                throw new Error(
                    `Your new event's time is identical to ${e.title}. Please consider merging these two events.`
                );
            }
        }
        this.events.push(new Event(days, display, title, description, room));
        this.computeSchedule();
    }

    public deleteEvent(days: string) {
        for (let i = 0; i < this.events.length; i++) {
            if (this.events[i].days === days) {
                this.events.splice(i, 1);
                break;
            }
        }
        this.computeSchedule();
    }

    public hoverEvent(key: string, strong = true) {
        for (const blocks of this.days) {
            for (const block of blocks) {
                if (block.section.key === key) block.strong = strong;
            }
        }
    }

    public unhoverEvent(key: string) {
        this.hoverEvent(key, false);
    }

    public hover(key: string, strong = true) {
        const sections = this.All[key];
        if (sections instanceof Set) {
            this.days.forEach(blocks => {
                for (const block of blocks) {
                    const container = block.section;
                    if (!(container instanceof Event)) {
                        if (container.has(sections, key)) block.strong = strong;
                    }
                }
            });
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

    /**
     * synchronous version of `computeSchedule`
     */
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
            const sections = all[key];
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
    private constructDateSeparator() {
        const sections: Section[] = [];
        for (const key in this.All) {
            if (this.All[key] === -1) continue;
            const course = window.catalog.getCourse(key, this.All[key]);
            // skip invalid dates
            for (const section of course.sections) {
                if (section.dateArray) {
                    sections.push(section);
                }
            }
        }

        // record all start and end points
        const tempSeparator: [number, number][] = [];
        for (const { dateArray } of sections) {
            const start = dateArray[0];
            let i = 0; // index for insertion
            outer: for (; i < tempSeparator.length; i++) {
                const target = tempSeparator[i][0];
                if (start < target) break;
                else if (start === target) continue outer; // remove repeated
            }
            // add one day to the end
            tempSeparator.splice(i, 0, [start, dateArray[1] + 24 * 60 * 60 * 1000]);
        }

        const _temp = new Set<number>();
        // abandon start points that are the same as some end points
        // e.g. in [[8/26 - 10.17], [10.17 - 12.6]], one 10.17 would be abandoned
        outer: for (let i = 0; i < tempSeparator.length; i++) {
            for (let j = 0; j < i; j++) {
                if (tempSeparator[i][0] === tempSeparator[j][1]) {
                    _temp.add(tempSeparator[i][1]);
                    continue outer;
                }
            }
            _temp.add(tempSeparator[i][0]).add(tempSeparator[i][1]);
        }
        this.dateSeparators = [..._temp].sort((a, b) => a - b);

        // create empty objects for separated "All"
        this.separatedAll = Object.create(null);
        for (let i = 1; i < this.dateSeparators.length; i++) {
            const temp = new Date(this.dateSeparators[i]);
            this.separatedAll[temp.getMonth() + 1 + '/' + temp.getDate()] = {};
        }

        for (const sec of sections) {
            const [start, end] = sec.dateArray;
            for (let i = 0; i < this.dateSeparators.length; i++) {
                const sep = this.dateSeparators[i];
                const temp = new Date(sep);
                if (start < sep && (i === 0 || end >= this.dateSeparators[i - 1])) {
                    const date = temp.getMonth() + 1 + '/' + temp.getDate();
                    const all = this.separatedAll[date] || Object.create(null);
                    const sections = all[sec.key];
                    if (sections instanceof Set) {
                        sections.add(sec.id);
                    } else {
                        all[sec.key] = new Set<number>().add(sec.id);
                    }
                    this.separatedAll[date] = all;
                }
                if (end < sep) break;
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
            const graph = this.constructAdjList(blocks);
            const len = graph.length;
            const visited = new Uint8Array(len);
            // find all connected components
            const components: ScheduleBlock[][] = [];
            for (let i = 0; i < len; i++) {
                if (!visited[i]) {
                    visited[i] = 1;
                    components.push(DFS(i, graph, visited).map(idx => blocks[idx]));
                }
            }

            // we run coloring for each component
            for (const bls of components) this._computeBlockPositions(bls);
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
     * Remove a course (and all its sections) from the schedule
     */
    public remove(key: string) {
        delete this.All[key];
        this.constructDateSeparator();
        this.computeSchedule();
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
     * instantiate a `Schedule` object from its JSON representation
     */
    public fromJSON(obj?: ScheduleJSON) {
        return Schedule.fromJSON(obj);
    }

    /**
     * Serialize `this` to JSON
     */
    public toJSON(): ScheduleJSON {
        const All: ScheduleAll<SectionJSON[]> = {};
        const catalog = window.catalog;
        // convert set to array
        for (const key in this.All) {
            const sections = this.All[key];
            if (sections instanceof Set) {
                All[key] = [...sections].map(id => {
                    const { section } = catalog.getSectionById(key, id)!;
                    return { id, section };
                });
            } else All[key] = sections;
        }
        return {
            All,
            events: this.events
        };
    }

    /**
     * get a copy of this schedule
     */
    public copy(deepCopyEvent = true) {
        const AllCopy: ScheduleAll = {};
        for (const key in this.All) {
            const sections = this.All[key];
            if (sections instanceof Set) {
                AllCopy[key] = new Set(sections);
            } else {
                AllCopy[key] = sections;
            }
        }
        // note: is it desirable to deep-copy all the events?
        return new Schedule(AllCopy, deepCopyEvent ? this.events.map(e => e.copy()) : this.events);
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

    public clean() {
        this.cleanSchedule();
        this.All = {};
        this._preview = null;
        this.events = [];
    }

    public empty() {
        return Object.keys(this.All).length === 0;
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
                if (val1.size !== val2.size) return false;
                for (const v of val1) if (!val2.has(v)) return false;
            }
        }

        return true;
    }

    /**
     * add some random event to the schedule. For testing purposes only
     */
    private randEvents(num = 20, maxDuration = 120, minDuration = 20) {
        for (let i = 0; i < num; i++) {
            let days = '';
            for (let j = 0; j < 7; j++) {
                if (Math.random() < 0.5) {
                    days += DAYS[j];
                }
            }
            if (!days) {
                i--;
                continue;
            }
            const start = Math.floor(Math.random() * (1440 - maxDuration));
            const end =
                start +
                minDuration +
                Math.floor(Math.random() * Math.min(1440 - start, maxDuration));

            days +=
                ' ' +
                Utils.to12hr(Utils.intTo24hr(start)) +
                ' - ' +
                Utils.to12hr(Utils.intTo24hr(end));
            try {
                this.addEvent(days, true, 'rand ' + i);
            } catch (e) {
                console.log(e);
                i--;
            }
        }
    }
}
