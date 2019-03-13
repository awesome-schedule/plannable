// eslint-disable-next-line
import { AllRecords, CourseRecord, Course } from './CourseRecord';
/**
 * A schedule is a list of courses
 */

class Schedule {
    static days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    static fields = ['All', ...Schedule.days, 'title', 'id'];
    static bgColors = [
        '#f7867e',
        '#ffb74c',
        '#D8C120',
        '#4B993D',
        '#28BA93',
        '#00d3be',
        '#355dff',
        '#7790ff',
        '#c277ff',
        '#e0a1ca',
        '#993D5F'
    ];
    /**
     *
     * @param {[string, int, int][]} raw_schedule
     * @param {string} title
     * @param {number} id
     * @param {AllRecords} allRecords
     */
    constructor(raw_schedule = [], title = 'Schedule', id = 0, allRecords = null) {
        /**
         * @type {Object<string, Set<number>|number>}
         */
        this.All = {};
        /**
         * @type {Course[]}
         */
        this.Monday = [];
        /**
         * @type {Course[]}
         */
        this.Tuesday = [];
        /**
         * @type {Course[]}
         */
        this.Wednesday = [];
        /**
         * @type {Course[]}
         */
        this.Thursday = [];
        /**
         * @type {Course[]}
         */
        this.Friday = [];

        this.previous = [null, null];

        this.title = title;
        this.id = id;
        this.allRecords = allRecords;

        for (let i = 0; i < raw_schedule.length; i++) {
            const [key, section] = raw_schedule[i];
            this.add(key, section, false);
        }
    }

    /**
     * Get the background color of a course
     * @param {Course} course
     * @return {string}
     */
    getColor(course) {
        return Schedule.bgColors[course.hash() % Schedule.bgColors.length];
    }

    /**
     * Check if a course already exist
     * @param {Course} course
     */
    exist(course) {
        return this.All.some(c => c.key === course.key);
    }

    /**
     * Add a course to schedule
     * @param {string} key
     * @param {number} section
     * @param {boolean} update
     * @return {boolean}
     */
    add(key, section, update = true) {
        if (this.All[key] instanceof Set) {
            if (this.All[key].has(section)) return false;
            this.All[key].add(section);
            if (update) this.computeSchedule();
        } else {
            this.All[key] = new Set([section]);
            if (update) this.computeSchedule();
            return true;
        }
    }

    /**
     *
     * @param {string} key
     * @param {Set<number> | number} section
     * @param {boolean} update
     */
    update(key, section, update = true) {
        if (section === -1) {
            if (this.All[key] === -1) delete this.All[key];
            else this.All[key] = -1;
        } else {
            if (this.All[key] instanceof Set) {
                if (!this.All[key].delete(section)) this.All[key].add(section);
            } else {
                this.All[key] = new Set([section]);
            }
        }
        if (update) this.computeSchedule();
    }

    removePreview() {
        this.previous = [null, null];
        this.computeSchedule();
    }

    preview(key, section) {
        this.previous = [key, section];
        this.computeSchedule();
    }

    /**
     * Compute the schedule view based on this.All and this.preview
     */
    computeSchedule() {
        if (!this.allRecords) return;
        this.cleanSchedule();
        for (const key in this.All) {
            const sections = this.All[key];
            // we only render those which has only one section given
            if (sections instanceof Set && sections.size === 1) {
                // we need a copy of course
                const course = this.allRecords.getCourse(key, [...sections.values()][0]).copy();
                this.place(course);
            }
        }

        const [k, v] = this.previous;
        if (k !== null && v !== null) {
            const course = this.allRecords.getCourse(k, v);
            course.key += 'preview';
            this.place(course);
        }
    }

    /**
     * Place the course on the schedule
     * Specifically, this method places the course into one of the Monday - Friday array
     * @param {Course} course
     */
    place(course) {
        course.backgroundColor = this.getColor(course);

        // parse MoWeFr 11:00PM - 11:50PM style time
        const [days, start, , end] = course.days.split(' ');
        for (let i = 0; i < days.length; i += 2) {
            switch (days.substr(i, 2)) {
                case 'Mo':
                    this.Monday.push(course);
                    break;
                case 'Tu':
                    this.Tuesday.push(course);
                    break;
                case 'We':
                    this.Wednesday.push(course);
                    break;
                case 'Th':
                    this.Thursday.push(course);
                    break;
                case 'Fr':
                    this.Friday.push(course);
                    break;
            }
            [course.start, course.end] = Schedule.parseTime(start, end);
        }
    }

    /**
     * Remove a course from schedule
     * @param {string} course
     */
    remove(key) {
        delete this.All[key];
        this.computeSchedule();
    }

    cleanSchedule() {
        for (const key of Schedule.days) {
            this[key] = [];
        }
    }
    /**
     *
     * @param {Object<string, any>} obj
     * @return {Schedule}
     */
    static fromJSON(obj, allRecords) {
        const schedule = new Schedule();
        schedule.allRecords = allRecords;
        for (const field of Schedule.fields) {
            schedule[field] = obj[field];
        }
        // convert array to set
        for (const key in obj.All) {
            if (obj.All[key] instanceof Array) schedule.All[key] = new Set(obj.All[key]);
        }
        for (const day of Schedule.days) {
            schedule[day].map(x => Object.setPrototypeOf(x, Course.prototype));
        }
        return schedule;
    }

    /**
     * @return {Object<string, any>}
     */
    toJSON() {
        const obj = {};
        for (const field of Schedule.fields) {
            obj[field] = this[field];
        }
        // deep copy All
        obj.All = Object.assign({}, this.All);
        // convert set to array
        for (const key in obj.All) {
            if (this.All[key] instanceof Set) obj.All[key] = [...this.All[key].values()];
        }
        return obj;
    }

    /**
     * Convert [11:00AM, 1:00PM] style to [11:00, 13:00] style time
     * @param {string} start
     * @param {string} end
     * @returns {[string, string]}
     */
    static parseTime(start, end) {
        let suffix = start.substr(start.length - 2, 2);
        let start_time, end_time;
        if (suffix == 'PM') {
            let [hour, minute] = start.substring(0, start.length - 2).split(':');
            start_time = `${(+hour % 12) + 12}:${minute}`;

            [hour, minute] = end.substring(0, end.length - 2).split(':');
            end_time = `${(+hour % 12) + 12}:${minute}`;
        } else {
            start_time = start.substring(0, start.length - 2);
            suffix = end.substr(end.length - 2, 2);
            const temp = end.substring(0, end.length - 2);
            if (suffix == 'PM') {
                const [hour, minute] = temp.split(':');
                end_time = `${(+hour % 12) + 12}:${minute}`;
            } else {
                end_time = temp;
            }
        }
        return [start_time, end_time];
    }

    static empty(allRecords) {
        return new Schedule([], 'Schedule', 1, allRecords);
    }

    clean() {
        this.cleanSchedule();
        this.All = {};
        this.preview = [null, null];
    }
}

export default {
    Schedule
};

export { Schedule };
