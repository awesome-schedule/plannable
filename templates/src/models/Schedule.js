import { AllRecords, CourseRecord } from './CourseRecord';
/**
 * A schedule is a list of courses
 */
class Schedule {
    /**
     *
     * @param {[string, int, int][]} raw_schedule
     * @param {string} title
     * @param {number} id
     * @param {AllRecords} allRecords
     */
    constructor(raw_schedule, title, id, allRecords) {
        /**
         * @type {CourseRecord[]}
         */
        this.All = [];
        /**
         * @type {CourseRecord[]}
         */
        this.Monday = [];
        /**
         * @type {CourseRecord[]}
         */
        this.Tuesday = [];
        /**
         * @type {CourseRecord[]}
         */
        this.Wednesday = [];
        /**
         * @type {CourseRecord[]}
         */
        this.Thursday = [];
        /**
         * @type {CourseRecord[]}
         */
        this.Friday = [];
        this.title = title;
        this.id = id;

        for (let i = 0; i < raw_schedule.length; i++) {
            const [key, section] = raw_schedule[i];
            let course = allRecords.get(key, section);

            course.color = `event-${(i % 4) + 1}`;
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
