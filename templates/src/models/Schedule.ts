import Course from './Course';
import CourseRecord from './CourseRecord';
import AllRecords from './AllRecords';

export type RawSchedule = Array<[string, number, number]>;
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
    public static readonly allRecords: AllRecords;
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
        // convert array to set
        for (const key in obj.All) {
            const sections = obj.All[key];
            if (sections instanceof Array) schedule.All[key] = new Set(sections);
            else schedule.All[key] = sections;
        }
        schedule.computeSchedule();
        return schedule;
    }
    /**
     * represents all courses in this schedule, stored as `[key, set of section]` pair
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
        [x: string]: Array<Course | CourseRecord>;
        Monday: Array<Course | CourseRecord>;
        Tuesday: Array<Course | CourseRecord>;
        Wednesday: Array<Course | CourseRecord>;
        Thursday: Array<Course | CourseRecord>;
        Friday: Array<Course | CourseRecord>;
    };
    /**
     * computed property
     */
    public colors: Set<number>;
    /**
     * computed property
     */
    public totalCredit: number;
    /**
     * a computed list that's updated by the `computeSchedule method`
     */
    public currentCourses: CourseRecord[];
    private previous: [string, number] | null;

    /**
     * Construct a `Schedule` object from its raw representation
     */
    constructor(raw_schedule: RawSchedule = [], title = 'Schedule', id = 0) {
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

        for (const [key, section] of raw_schedule) {
            this.add(key, section, false);
        }
        this.computeSchedule();
    }

    /**
     * Get the background color of a course
     */
    public getColor(course: Course | CourseRecord) {
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
     * @param update whether to re-compute the schedule
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
     * @param update whether to recompute schedule
     * @param remove whether to remove the key if the set of section is empty
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
        if (!Schedule.allRecords) return;
        this.cleanSchedule();
        this.currentCourses = [];
        for (const key in this.All) {
            const sections = this.All[key];
            const courseRecord = Schedule.allRecords.getRecord(key);
            this.currentCourses.push(courseRecord);
            this.totalCredit += isNaN(courseRecord.units)
                ? 0
                : parseFloat(courseRecord.units.toString());

            if (sections === -1) {
                this.place(courseRecord.copy());
            } else {
                // we need a copy of course
                if (sections.size === 1) {
                    this.place(courseRecord.getCourse(sections.values().next().value).copy());
                } else {
                    // a subset of the sections
                    this.place(courseRecord.getRecord([...sections.values()]).copy());
                }
            }
        }

        if (this.previous !== null) {
            const course = Schedule.allRecords.getCourse(...this.previous);
            course.key += 'preview';
            this.place(course);
        }
    }

    /**
     * places the course into one of the `Monday` to `Friday` array according to its `days` property
     */
    public place(course: Course | CourseRecord) {
        let days: string, start: string, end: string;

        // we only render a CourseRecord if all of its sections occur at the same time
        if (course instanceof CourseRecord) {
            for (let i = 0; i < course.days.length - 1; i++) {
                if (course.days[i] !== course.days[i + 1]) return;
            }
            [days, start, , end] = course.days[0].split(' ');
        } else {
            [days, start, , end] = course.days.split(' ');
        }
        course.backgroundColor = this.getColor(course);
        for (let i = 0; i < days.length; i += 2) {
            switch (days.substr(i, 2)) {
                case 'Mo':
                    this.days.Monday.push(course);
                    break;
                case 'Tu':
                    this.days.Tuesday.push(course);
                    break;
                case 'We':
                    this.days.Wednesday.push(course);
                    break;
                case 'Th':
                    this.days.Thursday.push(course);
                    break;
                case 'Fr':
                    this.days.Friday.push(course);
                    break;
            }
            [course.start, course.end] = Schedule.parseTime(start, end);
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
