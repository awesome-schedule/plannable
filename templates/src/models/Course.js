import CourseRecord from './CourseRecord';
class Course {
    /**
     * @param {import('./AllRecords').RawRecord} raw
     * @param {string} key
     * @param {number} section
     */
    constructor(raw, key, section = 0) {
        this.raw = raw;
        const sid = section;
        this.sid = sid;
        this.key = key;
        this.id = this[0] = raw[0][sid];
        this.department = this[1] = raw[1];
        this.number = this[2] = raw[2];
        this.section = this[3] = raw[3][sid];
        this.type = this[4] = isNaN(+raw[4]) ? raw[4] : CourseRecord.TYPES[raw[4]];
        this.units = this[5] = raw[5];
        this.instructor = this[6] = raw[6][sid];
        this.days = this[7] = raw[7][sid];
        this.room = this[8] = raw[8][sid];
        this.title = this[9] = raw[9];
        this.topic = this[10] = raw[10][sid];
        this.status = this[11] = isNaN(+raw[11][sid])
            ? raw[11][sid]
            : CourseRecord.TYPES[raw[11][sid]];
        this.enrollment = this[12] = raw[12][sid];
        this.enrollment_limit = this[13] = raw[13][sid];
        this.wait_list = this[14] = raw[14][sid];
        this.description = this[15] = raw[15];

        // only used in schedule rendering
        this.backgroundColor = 'white';
        this.start = '';
        this.end = '';

        // whether is the default section
        this.default = true;
    }

    /**
     * get a copy of Course
     * @return {Course}
     */
    copy() {
        const cp = new Course(this.raw, this.key, this.sid);
        cp.backgroundColor = this.backgroundColor;
        cp.start = this.start;
        cp.end = this.end;
        cp.default = this.default;
        return cp;
    }

    /**
     * Calculate a 32 bit FNV-1a hash
     * Found here: https://gist.github.com/vaiorabbit/5657561
     * Ref.: http://isthe.com/chongo/tech/comp/fnv/
     *
     * @param {string} str the input value
     * @returns {number}
     */
    static hashCode(str) {
        let hval = 0x811c9dc5;

        for (let i = 0, l = str.length; i < l; i++) {
            hval ^= str.charCodeAt(i);
            hval += (hval << 1) + (hval << 4) + (hval << 7) + (hval << 8) + (hval << 24);
        }
        return hval >>> 0;
    }

    /**
     * compute the hash of this course using its key
     */
    hash() {
        return Course.hashCode(this.key);
    }
}

export default Course;
