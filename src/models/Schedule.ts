import Section from './Section';
import Course from './Course';
import ScheduleBlock from './ScheduleBlock';
import Event from './Event';
import { RawAlgoSchedule } from '../algorithm/ScheduleGenerator';
import Meta from './Meta';
import * as Utils from './Utils';
import Hashable from './Hashable';

export interface ScheduleJSON {
    All: { [x: string]: number[] | -1 };
    title: string;
    id: number;
    events: Event[];
    savedColors: { [x: string]: string };
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
    /**
     * instantiate a `Schedule` object from its JSON representation
     */
    public static fromJSON(obj: ScheduleJSON) {
        const schedule = new Schedule();
        schedule.title = obj.title;
        schedule.id = obj.id;
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
                const m = x.match(regex) as RegExpMatchArray;
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
     * note that if **section** is -1, it means that all sections are allowed.
     * Otherwise **section** should be a Set of integers
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
     * - If the course is **already in** the schedule, delete it from the schedule
     * - If the course is **not** in the schedule, add it to the schedule
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

    /**
     * Compute the schedule view based on `this.All` and `this.preview`
     * @see {@link computeSchedule}
     */
    public computeSchedule() {
        const catalog = window.catalog;
        if (!catalog) return;
        console.time('render schedule');
        this.cleanSchedule();

        for (const key in this.All) {
            const sections = this.All[key];
            const course = catalog.getCourse(key);
            this.currentCourses.push(course);

            const credit = parseFloat(course.units);
            this.totalCredit += isNaN(credit) ? 0 : credit;

            const currentIdKey = `${course.department} ${course.number} ${course.type}`;
            if (sections === -1) {
                // if there's only one section in this Course, just treat it as a Section
                if (course.sections.length === 1) {
                    const section = course.getSection(0);
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
                } else {
                    // a subset of the sections
                    if (sections.size > 0) {
                        const sectionIndices = [...sections.values()];
                        this.place(course.getCourse(sectionIndices));
                        this.currentIds[currentIdKey] =
                            course.getSection(sectionIndices[0]).id.toString() +
                            '+' +
                            (sections.size - 1);
                    }
                }
            }
        }

        if (this.previous !== null) {
            const section = catalog.getSection(...this.previous);
            section.course.key += 'preview';
            this.place(section);
        }

        this.currentCourses.sort((a, b) => (a.key === b.key ? 0 : a.key < b.key ? -1 : 1));

        for (const event of this.events) {
            if (event.display) this.place(event);
        }

        console.timeEnd('render schedule');
    }

    /**
     * places a `Section`/`Course` into one of the `Mo` to `Fr` array according to its `days` property
     *
     * @remarks a Course instance if all of its sections occur at the same time
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
            const color = this.getColor(course);
            for (const meeting of course.sections[0].meetings) {
                this.placeHelper(color, meeting.days, course.sections);
            }
        }
    }

    public placeHelper(color: string, dayTimes: string, events: Section | Section[] | Event) {
        const [days, start, , end] = dayTimes.split(' ');
        const [startMin, endMin] = Utils.parseTimeAsString(start, end);
        for (let i = 0; i < days.length; i += 2) {
            const scheduleBlock = new ScheduleBlock(color, startMin, endMin, events);
            this.days[days.substr(i, 2)].push(scheduleBlock);
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
            if (sections instanceof Set) obj.All[key] = [...sections.values()];
            else obj.All[key] = sections;
        }
        return obj;
    }

    public toICal() {
        let ical = 'BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:UVa-Awesome-Schedule\n';

        let startWeekDay: number = 0;
        let startDate: Date = new Date(2019, 7, 27, 0, 0, 0),
            endDate: Date = new Date(2019, 11, 6, 0, 0, 0);

        for (const day of Meta.days) {
            for (const sb of this.days[day]) {
                if (sb.section instanceof Section) {
                    for (const m of sb.section.meetings) {
                        if (m.dates === 'TBD' || m.dates === 'TBA') continue;
                        const [sd, , ed] = m.dates.split(' ');
                        const [sl, sm, sr] = sd.split('/');
                        // startDate = [sr, sl, sm].join('-') + 'T04:00:00';
                        startDate = new Date(parseInt(sr), parseInt(sl) - 1, parseInt(sm), 0, 0, 0);
                        const [el, em, er] = ed.split('/');
                        // endDate = [er, el, em].join('-') + 'T04:00:00';
                        endDate = new Date(parseInt(er), parseInt(el) - 1, parseInt(em), 0, 0, 0);
                        startWeekDay = startDate.getDay();
                        // console.log(sl + ' ' + sm + ' ' + sr);
                        break;
                    }
                }
            }
        }

        for (let d = 0; d < 5; d++) {
            for (const sb of this.days[Meta.days[d]]) {
                if (sb.section instanceof Section || sb.section instanceof Array) {
                    let section = sb.section;
                    if (sb.section instanceof Array) {
                        section = (section as Section[])[0];
                    }
                    for (const m of (section as Section).meetings) {
                        if (m.days === 'TBD' || m.days === 'TBA') continue;
                        const dayoffset: number = ((d + 7 - startWeekDay) % 7) + 1;
                        const [, start, , end] = m.days.split(' ');
                        const [startMin, endMin] = Utils.parseTimeAsInt(start, end);

                        let startTime = new Date(
                            startDate.getTime() +
                                dayoffset * 24 * 60 * 60 * 1000 +
                                startMin * 60 * 1000
                        );
                        let endTime = new Date(
                            startDate.getTime() +
                                dayoffset * 24 * 60 * 60 * 1000 +
                                endMin * 60 * 1000
                        );

                        // console.log(startDate);
                        // console.log(startTime);
                        // console.log(endTime);
                        while (endDate.getTime() - endTime.getTime() >= 0) {
                            // console.log(startTime);
                            ical += this.oneICalEvent(startTime, endTime);
                            startTime = new Date(startTime.getTime() + 7 * 24 * 60 * 60 * 1000);
                            endTime = new Date(endTime.getTime() + 7 * 24 * 60 * 60 * 1000);
                        }
                    }
                } else if (sb.section instanceof Event) {
                    const dayoffset: number = ((d + 7 - startWeekDay) % 7) + 1;

                    const [, start, , end] = sb.section.days.split(' ');
                    const [startMin, endMin] = Utils.parseTimeAsInt(start, end);

                    let startTime = new Date(
                        startDate.getTime() + dayoffset * 24 * 60 * 60 * 1000 + startMin * 60 * 1000
                    );
                    let endTime = new Date(
                        startDate.getTime() + dayoffset * 24 * 60 * 60 * 1000 + endMin * 60 * 1000
                    );

                    while (endDate.getTime() - endTime.getTime() >= 0) {
                        ical += this.oneICalEvent(startTime, endTime);
                        startTime = new Date(startTime.getTime() + 7 * 24 * 60 * 60 * 1000);
                        endTime = new Date(endTime.getTime() + 7 * 24 * 60 * 60 * 1000);
                    }
                }
            }
        }
        ical += 'END:VCALENDAR';
        return ical;
    }

    public oneICalEvent(startTime: Date, endTime: Date, summary: string = '') {
        console.log(startTime);
        let ical = '';
        ical += 'BEGIN:VEVENT\n';
        ical += 'UID:\n';
        ical += 'DTSTAMP:' + this.dateToICalString(startTime) + '\n';
        ical += 'DTSTART:' + this.dateToICalString(startTime) + '\n';
        ical += 'DTEND:' + this.dateToICalString(endTime) + '\n';
        ical += 'SUMMARY:' + summary + '\n';
        ical += 'END:VEVENT\n';
        return ical;
    }

    public dateToICalString(date: Date) {
        console.log(date.getUTCDay());
        return (
            date.getUTCFullYear().toString() +
            (date.getUTCMonth() < 9
                ? '0' + (date.getUTCMonth() + 1)
                : (date.getUTCMonth() + 1).toString()) +
            (date.getUTCDate() < 10
                ? '0' + date.getUTCDate().toString()
                : date.getUTCDate().toString()) +
            'T' +
            (date.getUTCHours() < 10
                ? '0' + date.getUTCHours().toString()
                : date.getUTCHours().toString()) +
            (date.getUTCMinutes() < 10
                ? '0' + date.getUTCMinutes().toString()
                : date.getUTCMinutes().toString()) +
            '00Z'
        );
    }

    public dateStringToArr(date: string) {
        const [month, day, year] = date.split('/');
        return [year, month, day];
    }

    /**
     * get a copy of this schedule
     */
    public copy() {
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
        const cpy = new Schedule([], this.title, this.id, this.events.map(e => e.copy()));
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
