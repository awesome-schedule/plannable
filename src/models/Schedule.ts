/**
 * @author Hanzhi Zhou, Kaiying Shan
 * @module models
 */
// tslint:disable: member-ordering

/**
 *
 */
import { colorDepthSearch, graphColoringExact } from '../algorithm';
import { RawAlgoSchedule } from '../algorithm/ScheduleGenerator';
import * as Utils from '../utils';
import Course from './Course';
import Event from './Event';
import Hashable from './Hashable';
import ScheduleBlock from './ScheduleBlock';
import Section from './Section';
import noti from '@/store/notification';
import { Day, Week, TYPES, dayToInt } from './Meta';
import { checkDateConflict } from '../utils';

export interface ScheduleJSON {
    All: { [x: string]: { id: number; section: string }[] | number[] | -1 };
    events: Event[];
}

export interface ScheduleOptions {
    multiSelect: boolean;
    combineSections: boolean;
}

/**
 * Schedule handles the storage, access, mutation and render of courses and events.
 * @requires window.catalog
 */
export default class Schedule {
    public static readonly options: ScheduleOptions = Object.seal({
        combineSections: true,
        multiSelect: true
    });

    public static readonly bgColors: ReadonlyArray<string> = [
        '#f7867e',
        '#ffb74c',
        '#82677E',
        '#2C577C',
        '#6D838A',
        '#00a0a0',
        '#355dff',
        '#7790ff',
        '#9B5656',
        '#CC9393',
        '#993D5F'
    ];

    public static savedColors: { [x: string]: string } = {};

    public static isNumberArray(x: any[]): x is number[] {
        return typeof x[0] === 'number';
    }

    /**
     * instantiate a `Schedule` object from its JSON representation.
     * the `computeSchedule` method will be invoked
     */
    public static fromJSON(obj?: ScheduleJSON): Schedule | null {
        if (!obj) return null;
        const schedule = new Schedule();
        if (obj.events)
            schedule.events = obj.events.map(x => Object.setPrototypeOf(x, Event.prototype));

        const keys = Object.keys(obj.All).map(x => x.toLowerCase());
        if (keys.length === 0) return schedule;

        const catalog = window.catalog;
        const regex = /([a-z]{1,5})([0-9]{4})(.*)/i;
        // convert array to set
        for (const key of keys) {
            const sections = obj.All[key];
            const course = catalog.getCourse(key);
            const parts = key.match(regex);

            // converted key
            let convKey = key;
            if (parts && parts.length === 4) {
                parts[3] = TYPES[+parts[3]];
                convKey = parts.slice(1).join(' ');
            }
            // non existent course
            if (!course) {
                noti.warn(`${convKey} does not exist anymore! It probably has been removed!`);
                continue;
            }
            const allSections = course.sections;
            if (sections instanceof Array) {
                if (!sections.length) {
                    schedule.All[key] = new Set();
                } else {
                    // backward compatibility for version prior to v5.0 (inclusive)
                    if (Schedule.isNumberArray(sections)) {
                        schedule.All[key] = new Set(
                            sections.filter(sid => {
                                // sid >= length possibly implies that section is removed from SIS
                                if (sid >= allSections.length) {
                                    noti.warn(
                                        `Invalid section id ${sid} for ${convKey}. It probably has been removed!`
                                    );
                                }
                                return sid < allSections.length;
                            })
                        );
                    } else {
                        const set = new Set<number>();
                        for (const record of sections) {
                            // check whether the identifier of stored sections match with the existing sections
                            const idx = allSections.findIndex(
                                sec => sec.id === record.id && sec.section === record.section
                            );
                            if (idx !== -1) set.add(idx);
                            // if not, it possibly means that section is removed from SIS
                            else
                                noti.warn(
                                    `Section ${
                                    record.section
                                    } of ${convKey} does not exist anymore! It probably has been removed!`
                                );
                        }
                        schedule.All[key] = set;
                    }
                }
            } else {
                schedule.All[key] = sections;
            }
        }
        schedule.constructDateSeparator();
        schedule.computeSchedule();
        return schedule;
    }

    /**
     * represents all courses in this schedule, stored as `(key, set of sections)` pair
     *
     * Note that if **section** is -1, it means that all sections are allowed.
     * Otherwise, **section** should be a Set of integers
     *
     * @remarks This field is called `All` (yes, with the first letter capitalized) since the very beginning
     */
    public All: { [x: string]: Set<number> | -1 };
    /**
     * computed based on `this.All` by `computeSchedule`
     */
    public days: Week<ScheduleBlock>;
    /**
     * total credits stored in this schedule, computed based on `this.All`
     */
    public totalCredit: number;
    /**
     * a computed list that's updated by the `computeSchedule` method
     */
    public currentCourses: Course[];
    /**
     * a computed dictionary that's updated by the `computeSchedule` method.
     * If a Course has multiple sections selected, a `+x` will be appended.
     *
     * Example:
     * ```js
     * {"CS 2110 Lecture": "16436", "Chem 1410 Laboratory": "13424+2"}
     * ```
     */
    public currentIds: { [x: string]: string };

    /**
     * keep track of used colors to avoid color collision
     */
    public colorSlots: Set<string>[];
    public pendingCompute = 0;

    /**
     * The separator of sections in different time periods,
     * representing different end times of **sections**
     * Example:
     * ```js
     * [[10, 17], [12, 28]]
     * ```
     */
    public dateSeparators: number[] = [];
    public separatedAll: { [date: string]: { [x: string]: Set<number> | -1 } } = {};
    public dateSelector: number = -1;

    /**
     * the currently previewed (hovered) section
     */
    private _preview: Section | null;

    /**
     * Construct a `Schedule` object from its raw representation
     */
    constructor(raw_schedule: RawAlgoSchedule = [], public events: Event[] = []) {
        this.All = {};
        this.days = [[], [], [], [], []];
        this._preview = null;
        this.colorSlots = Array.from({ length: Schedule.bgColors.length }, () => new Set<string>());
        this.totalCredit = 0;
        this.currentCourses = [];
        this.currentIds = {};
        for (const [key, sections] of raw_schedule) {
            this.All[key] = new Set(sections);
        }
        this.constructDateSeparator();
        this.computeSchedule();
    }

    /**
     * Get the background color of a hashable object
     * Usually the object is either a `Course`, a `Section`, or an `Event`
     *
     * @remarks color collision is handled by separate chaining
     */
    public getColor(obj: Hashable): string {
        const userColor = Schedule.savedColors[obj.key];
        if (userColor) {
            return userColor;
        }
        const idx = obj.hash() % Schedule.bgColors.length;
        this.colorSlots[idx].add(obj.key);
        return Schedule.bgColors[idx];
    }

    /**
     * Update a section in the schedule
     * - If the section is **already in** the schedule, delete it from the schedule
     * - If the section is **not** in the schedule, add it to the schedule
     * @param remove whether to remove the key if the set of sections is empty
     */
    public update(key: string, section: number, remove: boolean = true) {
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

    public addEvent(
        days: string,
        display: boolean,
        title?: string,
        room?: string,
        description?: string
    ) {
        const newEvent = new Event(days, display, title, description, room);
        for (const e of this.events) {
            if (
                e.days === days ||
                Utils.checkTimeConflict(newEvent.toTimeArray(), e.toTimeArray())
            ) {
                throw new Error(`Your new event conflicts with ${e.title}`);
            }
        }
        this.events.push(newEvent);
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

    public hover(key: string, strong: boolean = true) {
        const sections = this.All[key];
        if (sections instanceof Set) {
            Object.values(this.days).forEach(blocks => {
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
     * @remarks this method has a very high time complexity.
     * However, because we're running on small input sets (usually contain no more than 20 sections), it
     * usually completes within 50ms.
     */
    public computeSchedule(sync = true) {
        window.clearTimeout(this.pendingCompute);
        if (sync) {
            this._computeSchedule();
        } else {
            this.pendingCompute = window.setTimeout(() => {
                this._computeSchedule();
            }, 10);
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
                : this.separatedAll[(temp.getMonth() + 1) + '/' + temp.getDate()];

        for (const key in all) {
            const sections = all[key];
            /**
             * we need a full course record of key `key`
             */
            this.currentCourses.push(catalog.getCourse(key));

            /**
             * a "partial" course with only selected sections
             */
            const course = catalog.getCourse(key, sections);

            // skip placing empty courses
            if (!course.sections.length) continue;

            const credit = parseFloat(course.units);
            this.totalCredit += isNaN(credit) ? 0 : credit;

            const currentIdKey = course.displayName;

            // if any section
            if (sections === -1) {
                this.currentIds[currentIdKey] = ' - ';
                this.place(course);
            } else {
                // only one section: place that section
                if (sections.size === 1) {
                    const sec = course.getFirstSection();
                    this.currentIds[currentIdKey] = sec.id.toString();
                    this.place(sec);
                } else if (sections.size > 0) {
                    if (Schedule.options.multiSelect) {
                        // try to combine sections even if we're in multi-select mode
                        const combined = Object.values(course.getCombined()).map(secs =>
                            catalog.getCourse(course.key, new Set(secs.map(sec => sec.sid)))
                        );
                        const id = combined[0].getFirstSection().id;

                        // count the total number of sections in this combined course array
                        const num = sections.size - 1;
                        for (const crs of combined) {
                            this.currentIds[currentIdKey] = num
                                ? `${id.toString()}+${num}` // use +n if there're multiple sections
                                : id.toString();
                            this.place(crs);
                        }
                    } else {
                        // a subset of the sections
                        this.place(course);
                        this.currentIds[currentIdKey] =
                            course.getFirstSection().id.toString() + '+' + (sections.size - 1);
                    }
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
                    if (!(block.section instanceof Event) && block.section.has(section)) {
                        found = block.strong = true;
                    }
                }
            }
            if (!found) {
                this.place(section);
            }
        }

        // sort currentCourses in alphabetical order
        this.currentCourses.sort((a, b) => (a.key === b.key ? 0 : a.key < b.key ? -1 : 1));

        for (const event of this.events) if (event.display) this.place(event);

        this.computeBlockPositions();
    }

    public constructDateSeparator() {
        const catalog = window.catalog;
        this.dateSeparators.length = 0;
        const tempSeparator: [number, number][] = [];

        for (const key in this.All) {
            if (this.All[key] === -1) {
                continue;
            }
            const course = catalog.getCourse(key, this.All[key]);
            for (const sec of course.sections) {
                tempSeparator.push(
                    [sec.dateArray[0],
                    sec.dateArray[1] + 24 * 60 * 60 * 1000]
                );
            }
        }

        tempSeparator.sort((a, b) => a[0] - b[0]);

        for (let i = 1; i < tempSeparator.length; i++) {
            if (tempSeparator[i - 1][0] === tempSeparator[i][0] && tempSeparator[i - 1][1] === tempSeparator[i][1]) {
                tempSeparator.splice(i, 1);
                i--;
            }
        }
        outer: for (let i = 0; i < tempSeparator.length; i++) {
            for (let j = 0; j < i; j++) {
                if (tempSeparator[i][0] === tempSeparator[j][1]) {
                    this.dateSeparators.push(tempSeparator[i][1]);
                    continue outer;
                }
            }
            this.dateSeparators.push(tempSeparator[i][0], tempSeparator[i][1]);
        }

        this.dateSeparators.sort((a, b) => a - b);

        for (let i = 1; i < this.dateSeparators.length; i++) {
            const a = this.dateSeparators[i - 1];
            const b = this.dateSeparators[i];
            if (a - b === 0) {
                this.dateSeparators.splice(i, 1);
                i--;
            }
        }

        for (const dts of this.dateSeparators) {
            const temp = new Date(dts);
            this.separatedAll[(temp.getMonth() + 1) + '/' + temp.getDate()] = {};
        }

        for (const key in this.All) {
            if (this.All[key] === -1) {
                continue;
            }
            const course = catalog.getCourse(key, this.All[key]);
            const diffSecs: { [dt: string]: number[] } = {};
            for (const sec of course.sections) {
                const [start, end] = sec.dateArray;
                for (let i = 0; i < this.dateSeparators.length; i++) {
                    const sep = this.dateSeparators[i];
                    const temp = new Date(sep);
                    if (
                        start < sep &&
                        (i === 0 || end >= this.dateSeparators[i - 1])
                    ) {
                        const date = (temp.getMonth() + 1) + '/' + temp.getDate();
                        if (diffSecs[date]) {
                            diffSecs[date].push(sec.sid);
                        } else {
                            diffSecs[date] = [sec.sid];
                        }
                    }
                    if (end < sep) {
                        break;
                    }
                }
            }
            for (const diffTime in diffSecs) {
                const secIds = diffSecs[diffTime];
                const secNum = new Set(secIds);
                this.separatedAll[diffTime][key] = secNum;
            }
        }
    }

    public computeBlockPositions() {
        for (const blocks of this.days) {
            blocks.sort((a, b) => b.duration - a.duration);
            const adjList: number[][] = blocks.map(() => []);

            // construct an undirected graph
            for (let i = 0; i < blocks.length; i++) {
                for (let j = i + 1; j < blocks.length; j++) {
                    if (blocks[i].conflict(blocks[j])) {
                        adjList[i].push(j);
                        adjList[j].push(i);
                    }
                }
            }
            // convert to typed array so its much faster
            const fastGraph = adjList.map(x => Int16Array.from(x));
            const colors = new Int16Array(fastGraph.length);
            const _ = graphColoringExact(fastGraph, colors);
            // const [colors, _] = dsatur(fastGraph);

            const graph = colorDepthSearch(fastGraph, colors);
            for (const node of graph.keys()) {
                // skip any non-root node in the depth-first trees
                if (node.parent) continue;

                // traverse all the paths starting from the root
                const paths = node.path;
                for (const path of paths) {
                    // compute the left and width of the root node if they're not computed
                    const firstBlock = blocks[path[0].val];
                    if (firstBlock.left === -1) {
                        firstBlock.left = 0;
                        firstBlock.width = 1 / (path[0].pathDepth + 1);
                    }

                    // computed the left and width of the remaining nodes based on
                    // the already computed information of the previous node
                    for (let i = 1; i < path.length; i++) {
                        const block = blocks[path[i].val];
                        const previousBlock = blocks[path[i - 1].val];

                        block.left = Math.max(block.left, previousBlock.left + previousBlock.width);

                        // remaining width / number of remaining path length
                        block.width = (1 - block.left) / (path[i].pathDepth - path[i].depth + 1);
                    }
                }
            }
            graph.clear();
        }
    }

    /**
     * places a `Section`/`Course`/`Event`/ into one of the `Mo` to `Fr` array according to its `days` property
     *
     * @remarks we can place a Course instance if all of its sections occur at the same time
     */
    public place(course: Section | Course | Event) {
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
                if (Schedule.options.combineSections) {
                    const color = this.getColor(course);
                    for (const meeting of firstSec.meetings)
                        this.placeHelper(color, meeting.days, course);
                } else {
                    // if we don't combined the sections, we call place each section
                    for (const section of course.sections) {
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

    public cleanSchedule() {
        this.days = [[], [], [], [], []];
        this.colorSlots.forEach(x => x.clear());
        this.totalCredit = 0;
        this.currentCourses = [];
        this.currentIds = {};
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
    public toJSON() {
        const obj: ScheduleJSON = {
            All: {},
            events: this.events
        };
        const catalog = window.catalog;
        // convert set to array
        for (const key in this.All) {
            const sections = this.All[key];
            if (sections instanceof Set) {
                obj.All[key] = [...sections].map(sid => {
                    const { id, section } = catalog.getSection(key, sid);
                    return { id, section };
                });
            } else obj.All[key] = sections;
        }
        return obj;
    }

    /**
     * get a copy of this schedule
     */
    public copy(deepCopyEvent = true) {
        const AllCopy: { [x: string]: Set<number> | -1 } = {};
        for (const key in this.All) {
            const sections = this.All[key];
            if (sections instanceof Set) {
                AllCopy[key] = new Set(sections);
            } else {
                AllCopy[key] = sections;
            }
        }
        // note: is it desirable to deep-copy all the events?
        const cpy = new Schedule([], deepCopyEvent ? this.events.map(e => e.copy()) : this.events);
        cpy.All = AllCopy;
        cpy.constructDateSeparator();
        cpy.computeSchedule();
        return cpy;
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
                Object.values(this.days).some(blocks =>
                    blocks.some(block => block.section.key === key)
                )
            );
        else return key in this.All || this.events.some(x => x.days === key);
    }

    public clean() {
        this.cleanSchedule();
        this.All = {};
        this._preview = null;
    }

    public empty() {
        return Object.keys(this.All).length === 0;
    }

    public equals(s: Schedule) {
        const keys = Object.keys(this.All);
        // unequal length
        if (keys.length !== Object.keys(s.All).length) return false;
        for (const key of keys) {
            const val1 = this.All[key],
                val2 = s.All[key];
            if (!val2) return false;
            // unequal value
            if (val1 === -1 || val2 === -1) {
                if (val1 !== val2) return false;
            } else {
                if (val1.size !== val2.size) return false;
                for (const v of val1) if (!val2.has(v)) return false;
            }
        }

        const days1 = this.events.map(x => x.days).sort();
        const days2 = s.events.map(x => x.days).sort();
        if (days1.length !== days2.length) return false;
        for (let i = 0; i < days1.length; i++) if (days1[i] !== days2[i]) return false;

        return true;
    }
}
