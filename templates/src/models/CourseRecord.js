//@ts-check
import Course from './Course';
class CourseRecord {
    /**
     * lecture type number => meaning
     */
    static TYPES = {
        '-1': '',
        0: 'Clinical',
        1: 'Discussion',
        2: 'Drill',
        3: 'Independent Study',
        4: 'Laboratory',
        5: 'Lecture',
        6: 'Practicum',
        7: 'Seminar',
        8: 'Studio',
        9: 'Workshop'
    };

    /**
     * status number => meaning
     */
    static STATUSES = {
        '-1': 'TBA',
        1: 'Open',
        0: 'Closed',
        2: 'Wait List'
    };

    static FIELDS = {
        0: 'id',
        1: 'department',
        2: 'number',
        3: 'section',
        4: 'type',
        5: 'units',
        6: 'instructor',
        7: 'days',
        8: 'room',
        9: 'title',
        10: 'topic',
        11: 'status',
        12: 'enrollment',
        13: 'enrollment_limit',
        14: 'wait_list',
        15: 'description'
    };

    static TYPES_PARSE = {
        Clinical: 0,
        Discussion: 1,
        Drill: 2,
        'Independent Study': 3,
        Laboratory: 4,
        Lecture: 5,
        Practicum: 6,
        Seminar: 7,
        Studio: 8,
        Workshop: 9
    };

    static STATUSES_PARSE = {
        Open: 1,
        Closed: 0,
        'Wait List': 2
    };

    /**
     * The list of indices at which the field is a list
     */
    static LIST = [0, 3, 6, 7, 8, 10, 11, 12, 13, 14];

    static LENGTH = 16;

    static PARSE_FUNC = [
        Number,
        null,
        Number,
        null,
        /**
         * @param {string} x
         */
        x => {
            const temp = CourseRecord.TYPES_PARSE[x];
            return temp ? temp : -1;
        },
        Number,
        /**
         * @param {string} x
         */
        x => x.split(','),
        null,
        null,
        null,
        null,
        /**
         * @param {string} x
         */
        x => {
            const temp = CourseRecord.STATUSES_PARSE[x];
            return temp ? temp : -1;
        },
        Number,
        Number,
        Number,
        null
    ];
    /**
     *
     * @param {import('./AllRecords').RawRecord} raw
     * @param {string} key
     * @param {number[]} sids A list of section indices
     */
    constructor(raw, key, sids = null) {
        this.key = key;
        this.raw = raw;

        this.id = this[0] = raw[0];
        this.department = this[1] = raw[1];
        this.number = this[2] = raw[2];
        this.section = this[3] = raw[3];
        this.type = this[4] = CourseRecord.TYPES[raw[4]];
        this.units = this[5] = raw[5];
        this.instructor = this[6] = raw[6];
        this.days = this[7] = raw[7];
        this.room = this[8] = raw[8];
        this.title = this[9] = raw[9];
        this.topic = this[10] = raw[10];
        this.status = this[11] = raw[11].map(status => CourseRecord.STATUSES[status]);
        this.enrollment = this[12] = raw[12];
        this.enrollment_limit = this[13] = raw[13];
        this.wait_list = this[14] = raw[14];
        this.description = this[15] = raw[15];

        if (sids !== null && sids.length > 0) {
            for (const i of CourseRecord.LIST) {
                const field = CourseRecord.FIELDS[i];
                this[field] = this[i] = [];
                for (const idx of sids) {
                    this[field].push(raw[i][idx]);
                }
            }
        }
    }

    /**
     * Get the course of a given section
     * @param {number} section
     * @return {Course}
     */
    getCourse(section) {
        return new Course(this.raw, this.key, section);
    }

    /**
     * Get the CourseRecord at a given range of sections
     * @param {number[]} sections
     * @return {CourseRecord}
     */
    getRecord(sections) {
        return new CourseRecord(this.raw, this.key, sections);
    }

    /**
     * @param {Object} object
     * @return {boolean}
     */
    equals(object) {
        if (object instanceof CourseRecord) {
            return this.key === object.key;
        } else {
            return false;
        }
    }
}

export default CourseRecord;
