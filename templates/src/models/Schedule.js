// eslint-disable-next-line
import { AllRecords, CourseRecord, Course } from './CourseRecord';
/**
 * A schedule is a list of courses
 */

class Schedule {
    static days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    /**
     *
     * @param {[string, int, int][]} raw_schedule
     * @param {string} title
     * @param {number} id
     * @param {AllRecords} allRecords
     */
    constructor(raw_schedule = [], title = 'Schedule', id = 0, allRecords = null) {
        /**
         * @type {Course[]}
         */
        this.All = [];
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

        this.colorSlots = [0, 0, 0, 0];

        this.title = title;
        this.id = id;

        for (let i = 0; i < raw_schedule.length; i++) {
            const [key, section] = raw_schedule[i];
            let course = allRecords.getCourse(key, section);
            course.color = i;

            this.add(course);
        }
    }

    getColor() {
        let minSlot = Infinity;
        let minIdx;
        for (const [idx, slot] of this.colorSlots.entries()) {
            if (slot < minSlot) {
                minIdx = idx;
                minSlot = slot;
            }
        }
        this.colorSlots[minIdx]++;
        return minIdx;
    }

    removeColor(idx) {
        this.colorSlots[idx]--;
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
     * @param {Course} course
     */
    add(course, force = false) {
        if (this.exist(course)) {
            if (force) this.remove(course);
            else return;
        }
        course.color = this.getColor();

        this.All.push(course);

        // parse MoWeFr 11:00PM - 11:50PM style time
        const [days, start, , end] = course.days.split(' ');
        /**
         * @type {string}
         */
        for (let i = 0; i < days.length; i += 2) {
            // we need a copy of course
            course = Object.assign({}, course);
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
     * @param {Course} course
     */
    remove(course) {
        if (!this.exist(course)) return;
        for (let i = 0; i < this.All.length; i++) {
            if (this.All[i].key === course.key) {
                // color attribute may not present on the target. Use that on the schedule instead.
                this.removeColor(this.All[i].color);
                this.All.splice(i, 1);
                for (const day of Schedule.days) {
                    const day_course = this[day];
                    for (let j = 0; j < day_course.length; j++) {
                        if (day_course[j].key === course.key) {
                            day_course.splice(j, 1);
                            break;
                        }
                    }
                }
                break;
            }
        }
    }

    /**
     *
     * @param {string} start
     * @param {string} end
     * @returns {[string, string]}
     */
    static parseTime(start, end) {
        // convert to 24h format
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

    clean() {}
}

export default {
    Schedule
};

export { Schedule };
