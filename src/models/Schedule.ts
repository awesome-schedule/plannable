import Section from './Section';
import Course from './Course';
import ScheduleBlock from './ScheduleBlock';
import Event from './Event';
import { RawAlgoSchedule } from '../algorithm/ScheduleGenerator';
import Meta from './Meta';
import * as Utils from '../utils';
import Hashable from './Hashable';
import { Vertex, depthFirstSearch, Graph } from './Graph';

export interface ScheduleJSON {
    All: { [x: string]: number[] | -1 };
    title: string;
    id: number;
    events: Event[];
    savedColors: { [x: string]: string };
}

export interface ScheduleOptions {
    multiSelect: boolean;
    combineSections: boolean;
}

/**
 * A schedule is a list of courses with computed properties that aid rendering
 *
 * Note that `window.catalog` must be initialized before calling any instance method of the Schedule class
 */
class Schedule {
    public static readonly fields = ['All', 'title', 'id'];
    public static readonly bgColors = [
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
    public static options: ScheduleOptions = {
        multiSelect: true,
        combineSections: true
    };

    /**
     * instantiate a `Schedule` object from its JSON representation
     */
    public static fromJSON(obj?: ScheduleJSON) {
        if (!obj) return null;
        const schedule = new Schedule();
        schedule.title = obj.title ? obj.title : 'schedule';
        schedule.id = obj.id ? obj.id : 0;
        if (obj.events)
            schedule.events = obj.events.map(x => Object.setPrototypeOf(x, Event.prototype));
        if (obj.savedColors) Schedule.savedColors = obj.savedColors;
        const keys = Object.keys(obj.All).map(x => x.toLowerCase());
        if (keys.length === 0) return schedule;
        const regex = /([a-z]{1,5})([0-9]{4})(.*)/i;
        const match = keys[0].match(regex);
        if (!match || !match[3]) return null;

        if (isNaN(parseInt(match[3]))) {
            const newKeys = keys.map(x => {
                const m = x.match(regex)!;
                const y = m[3]
                    .split(' ')
                    .map(z => z.charAt(0).toUpperCase() + z.substr(1))
                    .join(' ');
                return m[1] + m[2] + Meta.TYPES_PARSE[y];
            });
            for (let i = 0; i < keys.length; i++) {
                const sections = obj.All[keys[i]];
                if (sections instanceof Array) schedule.All[newKeys[i]] = new Set(sections);
                else schedule.All[newKeys[i]] = sections;
            }
        } else {
            // convert array to set
            for (const key of keys) {
                const sections = obj.All[key];
                if (sections instanceof Array) schedule.All[key] = new Set(sections);
                else schedule.All[key] = sections;
            }
        }
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
    public title: string;
    public id: number;
    /**
     * computed based on `this.All` by `computeSchedule`
     */
    public days: {
        [x: string]: ScheduleBlock[];
        Mo: ScheduleBlock[];
        Tu: ScheduleBlock[];
        We: ScheduleBlock[];
        Th: ScheduleBlock[];
        Fr: ScheduleBlock[];
    };
    /**
     * total credits stored in this schedule, computed based on `this.All`
     */
    public totalCredit: number;
    /**
     * a computed list that's updated by the `computeSchedule` method
     */
    public currentCourses: Course[];
    /**
     * a computed dictionary that's updated by the `computeSchedule` method
     *
     * @remarks If a Course has multiple sections selected, a `+x` will be appended
     *
     * @example
     * {"CS 2110 Lecture": "16436", "Chem 1410 Laboratory": "13424+2"}
     */
    public currentIds: { [x: string]: string };

    public events: Event[];

    /**
     * keep track of used colors to avoid color collision
     */
    public colorSlots: Array<Set<string>>;
    public pendingCompute = 0;

    private previous: [string, number] | null;

    /**
     * Construct a `Schedule` object from its raw representation
     */
    constructor(
        raw_schedule: RawAlgoSchedule = [],
        title = 'Schedule',
        id = 0,
        events: Event[] = []
    ) {
        this.All = {};
        this.days = {
            Mo: [],
            Tu: [],
            We: [],
            Th: [],
            Fr: []
        };
        this.previous = null;
        this.title = title;
        this.id = id;
        this.colorSlots = Array.from({ length: Schedule.bgColors.length }, () => new Set<string>());
        this.totalCredit = 0;
        this.currentCourses = [];
        this.currentIds = {};
        this.events = events;

        for (const [key, , sections] of raw_schedule) {
            this.All[key] = new Set(sections);
        }
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

    public setColor(obj: Hashable | string, color: string) {
        let key: string;
        let idx: number;
        if (typeof obj === 'string') {
            key = obj;
            idx = Utils.hashCode(key) % Schedule.bgColors.length;
        } else {
            key = obj.key;
            idx = obj.hash() % Schedule.bgColors.length;
        }
        const hashColor = Schedule.bgColors[idx];
        if (color === hashColor) {
            if (Schedule.savedColors[key]) delete Schedule.savedColors[key];
        } else {
            Schedule.savedColors[key] = color;
            this.colorSlots[idx].delete(key);
        }
        this.computeSchedule();
    }

    /**
     * Add a course to schedule
     * @param update whether to recompute the schedule
     */
    public add(key: string, section: number, update = true) {
        const sections = this.All[key];
        if (sections instanceof Set) {
            if (sections.has(section)) return false;
            sections.add(section);
            if (update) this.computeSchedule();
        } else {
            this.All[key] = new Set([section]);
            if (update) this.computeSchedule();
        }
        return true;
    }

    /**
     * Update a course in the schedule
     * - If the section is **already in** the schedule, delete it from the schedule
     * - If the section is **not** in the schedule, add it to the schedule
     *
     * @param update whether to recompute schedule after update
     * @param remove whether to remove the key if the set of sections is empty
     */
    public update(key: string, section: number, update: boolean = true, remove: boolean = true) {
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
        if (update) this.computeSchedule();
    }

    public removePreview() {
        this.previous = null;
        this.computeSchedule();
    }

    public preview(key: string, section: number) {
        this.previous = [key, section];
        this.computeSchedule();
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
            if (e.days === days || Utils.checkTimeConflict(newEvent.toTimeDict(), e.toTimeDict())) {
                throw new Error('Just one thing at a time, please.');
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
     *
     * @remarks this method has a very high time complexity, probably cubic in the number of sections.
     * However, because we're running on small input sets (usually contain no more than 20 sections), it
     * usually completes within 50ms.
     */
    public computeSchedule() {
        window.clearTimeout(this.pendingCompute);
        this.pendingCompute = window.setTimeout(() => this._computeSchedule(), 10);
    }

    public _computeSchedule() {
        const catalog = window.catalog;
        if (!catalog) return;

        console.time('compute schedule');
        this.cleanSchedule();

        for (const key in this.All) {
            const sections = this.All[key];
            /**
             * the full course record of key `key`
             */
            const course = catalog.getCourse(key);
            this.currentCourses.push(course);

            const credit = parseFloat(course.units);
            this.totalCredit += isNaN(credit) ? 0 : credit;

            const currentIdKey = `${course.department} ${course.number} ${course.type}`;
            if (sections === -1) {
                // if there's only one section in this Course, just treat it as a Section
                if (course.sections.length === 1) {
                    const section = course.getFirstSection();
                    this.currentIds[currentIdKey] = section.id.toString();
                    this.place(section);
                } else {
                    this.currentIds[currentIdKey] = ' - ';
                    this.place(course);
                }
            } else {
                // we need a copy of course
                if (sections.size === 1) {
                    const sectionIdx = sections.values().next().value;
                    this.currentIds[currentIdKey] = course.getSection(sectionIdx).id.toString();
                    this.place(course.getSection(sectionIdx));
                } else if (sections.size > 0) {
                    if (Schedule.options.multiSelect) {
                        // try to combine sections even if we're in multi-select mode
                        const combined: Course[] = Object.values(
                            course.getCourse([...sections]).getCombined()
                        ).map(secs => Section.sectionsToCourse(secs));
                        const id = combined[0].getFirstSection().id;

                        // count the total number of sections in this combined course array
                        const num = sections.size - 1;
                        for (const crs of combined) {
                            this.currentIds[currentIdKey] = num
                                ? `${id.toString()}+${num}`
                                : id.toString();
                            this.place(crs);
                        }
                    } else {
                        // a subset of the sections
                        const sectionIndices = [...sections];
                        this.place(course.getCourse(sectionIndices));
                        this.currentIds[currentIdKey] =
                            course.getSection(sectionIndices[0]).id.toString() +
                            '+' +
                            (sections.size - 1);
                    }
                }
            }
        }

        if (this.previous) {
            const [key, secIdx] = this.previous;
            const sections = this.All[key];
            const section = catalog.getSection(key, secIdx);
            // do not place into the schedule if the section is already in this.All
            if (!(sections instanceof Set) || !sections.has(secIdx)) {
                this.place(section);
            } else {
                // instead, we highlight the schedule
                for (const day in this.days) {
                    const blocks = this.days[day];
                    for (const block of blocks) {
                        if (!(block.section instanceof Event))
                            if (block.section.has(section)) block.strong = true;
                    }
                }
            }
        }

        // sort currentCourses in alphabetical order
        this.currentCourses.sort((a, b) => (a.key === b.key ? 0 : a.key < b.key ? -1 : 1));

        for (const event of this.events) if (event.display) this.place(event);

        this.computeConflict();
        console.timeEnd('compute schedule');
    }

    /**
     * Construct an undirected graph for the scheduleBlocks in each day.
     * Perform DFS on that graph to determine the
     * maximum number of conflicting schedules that need to be rendered "in parallel".
     *
     * @param countEvent whether to include events in this graph
     */
    public computeConflict(countEvent = true) {
        const graph: Graph<ScheduleBlock> = new Map();

        // construct conflict graph for each column
        for (const day in this.days) {
            const blocks = countEvent
                ? this.days[day]
                : this.days[day].filter(block => !(block.section instanceof Event));

            // instantiate all the nodes
            const nodes: Vertex<ScheduleBlock>[] = [];
            for (let i = 0; i < blocks.length; i++) {
                const v = new Vertex(blocks[i]);
                nodes.push(v);
                graph.set(v, []);
            }

            // construct an undirected graph for all scheduleBlocks.
            // the edge from node i to node j exists iff block[i] conflicts with block[j]
            for (let i = 0; i < blocks.length; i++) {
                for (let j = i + 1; j < blocks.length; j++) {
                    const ib = nodes[i];
                    const jb = nodes[j];
                    if (ib.val.conflict(jb.val)) {
                        graph.get(ib)!.push(jb);
                        graph.get(jb)!.push(ib);
                    }
                }
            }

            // perform a depth-first search
            depthFirstSearch(graph);

            for (const node of nodes) {
                // skip any non-root node in the depth-first trees
                if (node.parent) continue;

                // traverse all the paths starting from the root
                const paths = node.path;
                for (const path of paths) {
                    // compute the left and width of the root node if they're not computed
                    if (path[0].val.left === -1) {
                        path[0].val.left = 0;
                        path[0].val.width = 1 / (path[0].pathDepth + 1);
                    }

                    // computed the left and width of the remaining nodes based on
                    // the already computed information of the previous node
                    for (let i = 1; i < path.length; i++) {
                        const block = path[i].val;

                        // skip already computed nodes
                        if (block.left !== -1) continue;

                        block.left = path[i - 1].val.left + path[i - 1].val.width;

                        // remaining width / number of remaining path length
                        block.width = (1 - block.left) / (path[i].pathDepth - path[i].depth + 1);
                    }
                }
            }

            for (const block of blocks) {
                if (block.left === -1 || block.width === -1) {
                    console.error('Uncomputed block found!', block);
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

    public placeHelper(color: string, dayTimes: string, events: Section | Course | Event) {
        const [days, start, , end] = dayTimes.split(' ');
        if (days && start && end) {
            const startMin = Utils.to24hr(start);
            const endMin = Utils.to24hr(end);
            // wait... start time equals end time?
            if (startMin === endMin) {
                console.warn(events, startMin, endMin);
                return;
            }
            for (let i = 0; i < days.length; i += 2) {
                const scheduleBlock = new ScheduleBlock(color, startMin, endMin, events);
                this.days[days.substr(i, 2)].push(scheduleBlock);
            }
        }
    }

    /**
     * Remove a course (and all its sections) from the schedule
     */
    public remove(key: string) {
        delete this.All[key];
        this.computeSchedule();
    }

    public cleanSchedule() {
        for (const key in this.days) {
            this.days[key] = [];
        }
        this.colorSlots.forEach(x => x.clear());
        this.totalCredit = 0;
        this.currentCourses = [];
        this.currentIds = {};
    }

    /**
     * instantiate a `Schedule` object from its JSON representation
     */
    public fromJSON(obj: ScheduleJSON) {
        return Schedule.fromJSON(obj);
    }

    /**
     * Serialize `this` to JSON
     */
    public toJSON() {
        const obj: ScheduleJSON = {
            All: {},
            id: this.id,
            title: this.title,
            events: this.events,
            savedColors: Schedule.savedColors
        };
        // convert set to array
        for (const key in this.All) {
            const sections = this.All[key];
            if (sections instanceof Set) obj.All[key] = [...sections];
            else obj.All[key] = sections;
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
        const cpy = new Schedule(
            [],
            this.title,
            this.id,
            deepCopyEvent ? this.events.map(e => e.copy()) : this.events
        );
        cpy.All = AllCopy;
        cpy.computeSchedule();
        return cpy;
    }

    /**
     * Check whether the given key exists in the Schedule.
     *
     * This method will go through the `events` array and `All` property to check for existence of the key
     */
    public has(key: string) {
        return key in this.All || this.events.some(x => x.days === key);
    }

    public clean() {
        this.cleanSchedule();
        this.All = {};
        this.previous = null;
    }

    public empty() {
        return Object.keys(this.All).length === 0;
    }
}

export default Schedule;
