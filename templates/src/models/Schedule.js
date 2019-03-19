import Course from './Course';
/**
 * A schedule is a list of courses
 */
/**
 * @typedef {[string, number, number][]} RawSchedule
 */
class Schedule {
    static days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    static fields = ['All', 'title', 'id'];
    static bgColors = [
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
     * @type {import('./AllRecords').default}
     */
    static allRecords;
    /**
     * Construct a `Schedule` object from its raw representation
     * @param {RawSchedule} raw_schedule
     * @param {string} title
     * @param {number} id
     */
    constructor(raw_schedule = [], title = 'Schedule', id = 0) {
        /**
         * represents all courses in this schedule, stored as `[key, section]` pair
         * note that if **section** is -1, it means that all sections are allowed.
         * Otherwise **section** should be a Set of integers
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

        /**
         * @type {[string, number]}
         */
        this.previous = null;

        this.title = title;
        this.id = id;

        this.colors = new Set();

        for (let i = 0; i < raw_schedule.length; i++) {
            const [key, section] = raw_schedule[i];
            this.add(key, section, false);
        }
        this.computeSchedule();
    }

    /**
     * Get the background color of a course
     * @param {Course} course
     * @return {string}
     */
    getColor(course) {
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
     * @param {string} key
     * @param {number} section
     * @param {boolean} update whether to re-compute the schedule
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
        }
        return true;
    }

    /**
     * Update a course in the schedule
     * - If the course is **already in** the schedule, delete it from the schedule
     * - If the course is **not** in the schedule, add it to the schedule
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
        this.previous = null;
        this.computeSchedule();
    }

    /**
     *
     * @param {string} key
     * @param {number} section
     */
    preview(key, section) {
        this.previous = [key, section];
        this.computeSchedule();
    }

    /**
     * Compute the schedule view based on `this.All` and `this.preview`
     * @see {@link computeSchedule}
     */
    computeSchedule() {
        if (!Schedule.allRecords) return;
        this.cleanSchedule();
        for (const key in this.All) {
            const sections = this.All[key];
            // we only render those which has only one section given
            if (sections instanceof Set && sections.size === 1) {
                // we need a copy of course
                const course = Schedule.allRecords.getCourse(key, [...sections.values()][0]).copy();
                this.place(course);
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
     * Remove a course (and all its sections) from the schedule
     * @param {string} key
     */
    remove(key) {
        delete this.All[key];
        this.computeSchedule();
    }

    cleanSchedule() {
        for (const key of Schedule.days) {
            this[key] = [];
        }
        this.colors.clear();
    }
    /**
     * instantiate a `Schedule` object from its JSON representation
     * @param {Object<string, any>} obj
     * @return {Schedule}
     */
    static fromJSON(obj) {
        const schedule = new Schedule();
        for (const field of Schedule.fields) {
            schedule[field] = obj[field];
        }
        // convert array to set
        for (const key in obj.All) {
            if (obj.All[key] instanceof Array) schedule.All[key] = new Set(obj.All[key]);
        }
        schedule.computeSchedule();
        return schedule;
    }

    /**
     * Serialize `this` to JSON
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

    static empty() {
        return new Schedule([], 'Schedule', 1);
    }

    clean() {
        this.cleanSchedule();
        this.All = {};
        this.previous = null;
    }
}

export default Schedule;
