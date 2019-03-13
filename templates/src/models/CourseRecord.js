import Course from './Course';

class CourseRecord {
    /**
     * lecture type number => meaning
     */
    static TYPES = {
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

    /**
     * The list of indices at which the field is a list
     */
    static LIST = [0, 3, 6, 7, 8, 10, 11, 12, 13, 14, 15];

    /**
     *
     * @param {[number[], string, number, number[], number, number, string[][], string[], string[], string, string[], number[], number[], number[], number[], string]} raw
     * @param {string} key
     * @param {number[]} sid A list of section indices
     */
    constructor(raw, key, sids = null) {
        this.key = key;

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
        return new Course(this, this.key, section);
    }

    /**
     * Get the CourseRecord at a given range of sections
     * @param {number[]} sections
     * @return {CourseRecord}
     */
    getRecord(sections) {
        return new CourseRecord(this, this.key, sections);
    }

    /**
     * @param {Object} object
     */
    equals(object) {
        if (object instanceof CourseRecord) {
            return this.id == object.id;
        } else {
            return this.id == object[0];
        }
    }
}

export default CourseRecord;
