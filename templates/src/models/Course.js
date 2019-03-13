import CourseRecord from './CourseRecord';

class Course {
    /**
     * @param {[number[], string, number, number[], number, number, string[][], string[], string[], string, string[], number[], number[], number[], number[], string]} raw
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

        //
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

    hash() {
        let hash = 0;
        if (this.key.length === 0) return hash;
        for (let i = 0; i < this.key.length; i++) {
            const chr = this.key.charCodeAt(i);
            hash = (hash << 5) - hash + chr;
            hash |= 0; // Convert to 32bit integer
        }
        return Math.abs(hash);
    }
}

export default Course;
