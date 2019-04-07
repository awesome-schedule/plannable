import Section from './Section';
import Course from './Course';
import Catalog from './Catalog';
import ScheduleBlock from './ScheduleBlock';
import Meeting from './Meeting';
import { RawAlgoSchedule } from '@/algorithm/ScheduleGenerator';
import Meta from './Meta';

export interface ScheduleJSON {
    All: { [x: string]: number[] | -1 };
    title: string;
    id: number;
}

/**
 * A schedule is a list of courses with computed properties that aid rendering
 */
class Schedule {
    public static readonly days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
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
    /**
     * this field must be initialized before calling any instance method of the Schedule class
     */
    public static readonly catalog: Catalog;
    /**
     * Convert [11:00AM, 1:00PM] style to [11:00, 13:00] style time
     */
    public static parseTime(start: string, end: string): [string, string] {
        let suffix = start.substr(start.length - 2, 2);
        let start_time: string;
        let end_time: string;
        if (suffix === 'PM') {
            let [hour, minute] = start.substring(0, start.length - 2).split(':');
            start_time = `${(+hour % 12) + 12}:${minute}`;

            [hour, minute] = end.substring(0, end.length - 2).split(':');
            end_time = `${(+hour % 12) + 12}:${minute}`;
        } else {
            start_time = start.substring(0, start.length - 2);
            suffix = end.substr(end.length - 2, 2);
            const temp = end.substring(0, end.length - 2);
            if (suffix === 'PM') {
                const [hour, minute] = temp.split(':');
                end_time = `${(+hour % 12) + 12}:${minute}`;
            } else {
                end_time = temp;
            }
        }
        return [start_time, end_time];
    }
    /**
     * instantiate a `Schedule` object from its JSON representation
     */
    public static fromJSON(obj: ScheduleJSON) {
        const schedule = new Schedule();
        schedule.title = obj.title;
        schedule.id = obj.id;
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
        Monday: ScheduleBlock[];
        Tuesday: ScheduleBlock[];
        Wednesday: ScheduleBlock[];
        Thursday: ScheduleBlock[];
        Friday: ScheduleBlock[];
    };
    /**
     * computed property
     */
    public totalCredit: number;
    /**
     * a computed list that's updated by the `computeSchedule` method
     */
    public currentCourses: Course[];
    /**
     * a computed dictionary that's updated by the `computeSchedule` method
     * @remarks If a Course has multiple sections selected, a `+x` will be appended
     *
     * it has format `{"CS 2110 Lecture": "16436", "Chem 1410 Laboratory": "13424+2"}`
     */
    public currentIds: { [x: string]: string };

    private previous: [string, number] | null;
    /**
     * a property used internally to keep track of used colors to avoid color collision
     */
    private colors: Set<number>;

    /**
     * Construct a `Schedule` object from its raw representation
     */
    constructor(raw_schedule: RawAlgoSchedule = [], title = 'Schedule', id = 0) {
        this.All = {};
        this.days = {
            Monday: [],
            Tuesday: [],
            Wednesday: [],
            Thursday: [],
            Friday: []
        };
        this.previous = null;
        this.title = title;
        this.id = id;
        this.colors = new Set();
        this.totalCredit = 0;
        this.currentCourses = [];
        this.currentIds = {};

        for (const [key, , sections] of raw_schedule) {
            this.All[key] = new Set(sections);
        }
        this.computeSchedule();
    }

    /**
     * Get the background color of a course
     */
    public getColor(course: Course | Section) {
        let hash = course.hash();
        let idx = hash % Schedule.bgColors.length;
        // avoid color collision by linear probing
        while (this.colors.has(idx)) {
            hash += 1;
            idx = hash % Schedule.bgColors.length;
        }
        this.colors.add(idx);
        return Schedule.bgColors[idx];
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

    /**
     * Compute the schedule view based on `this.All` and `this.preview`
     * @see {@link computeSchedule}
     */
    public computeSchedule() {
        if (!Schedule.catalog) return;
        this.cleanSchedule();
        this.currentCourses = [];
        for (const key in this.All) {
            const sections = this.All[key];
            const course = Schedule.catalog.getCourse(key);
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
                    this.currentIds[currentIdKey] = 'See modal';
                    this.place(course.copy());
                }
            } else {
                // we need a copy of course
                if (sections.size === 1) {
                    const sectionIdx = sections.values().next().value;
                    this.currentIds[currentIdKey] = course.getSection(sectionIdx).id.toString();
                    this.place(course.getSection(sectionIdx));
                } else {
                    // a subset of the sections
                    const sectionIdx = sections.values().next().value;
                    this.place(course.getCourse([...sections.values()]));
                    this.currentIds[currentIdKey] =
                        course.getSection(sectionIdx).id.toString() + '+' + (sections.size - 1);
                }
            }
        }

        if (this.previous !== null) {
            const section = Schedule.catalog.getSection(...this.previous);
            section.course.key += 'preview';
            this.place(section);
        }

        this.currentCourses.sort((a, b) => (a.key === b.key ? 0 : a.key < b.key ? -1 : 1));
    }

    /**
     * places a `Section`/`Course` into one of the `Monday` to `Friday` array according to its `days` property
     *
     * @remarks a Course instance if all of its sections occur at the same time
     */
    public place(course: Section | Course) {
        if (course instanceof Section) {
            this.placeHelper(this.getColor(course), course.meetings, course);
        } else {
            if (!course.allSameTime()) return;
            this.placeHelper(this.getColor(course), course.sections[0].meetings, course.sections);
        }
    }

    public placeHelper(color: string, meetings: Meeting[], sections: Section | Section[]) {
        for (const meeting of meetings) {
            // eslint-disable-next-line
            // tslint:disable-next-line: prefer-const
            let [days, start, , end] = meeting.days.split(' ');
            [start, end] = Schedule.parseTime(start, end);
            for (let i = 0; i < days.length; i += 2) {
                const scheduleBlock = new ScheduleBlock(color, start, end, sections);
                switch (days.substr(i, 2)) {
                    case 'Mo':
                        this.days.Monday.push(scheduleBlock);
                        break;
                    case 'Tu':
                        this.days.Tuesday.push(scheduleBlock);
                        break;
                    case 'We':
                        this.days.Wednesday.push(scheduleBlock);
                        break;
                    case 'Th':
                        this.days.Thursday.push(scheduleBlock);
                        break;
                    case 'Fr':
                        this.days.Friday.push(scheduleBlock);
                        break;
                }
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
        this.colors.clear();
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
            title: this.title
        };
        // convert set to array
        for (const key in this.All) {
            const sections = this.All[key];
            if (sections instanceof Set) obj.All[key] = [...sections.values()];
            else obj.All[key] = sections;
        }
        return obj;
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
