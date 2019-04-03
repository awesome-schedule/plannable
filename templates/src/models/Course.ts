import CourseRecord from './CourseRecord';

import { RawRecord } from './AllRecords';
class Course {
    /**
     * Calculate a 32 bit FNV-1a hash
     * @see https://gist.github.com/vaiorabbit/5657561
     * @see http://isthe.com/chongo/tech/comp/fnv/
     * @param {string} str the input value
     * @returns {number}
     */
    public static hashCode(str: string): number {
        let hval = 0x811c9dc5;

        for (let i = 0, l = str.length; i < l; i++) {
            hval ^= str.charCodeAt(i);
            hval += (hval << 1) + (hval << 4) + (hval << 7) + (hval << 8) + (hval << 24);
        }
        return hval >>> 0;
    }
    public raw: RawRecord;
    public sid: number;
    public key: string;

    public id: number;
    public department: string;
    public number: number;
    public section: string;
    public type: any;
    public units: number;
    public instructor: string[];
    public days: string;
    public room: string;
    public title: string;
    public topic: string;
    public status: any;
    public enrollment: number;
    public enrollment_limit: number;
    public wait_list: number;
    public description: string;
    public backgroundColor: string;
    public start: string;
    public end: string;
    public default: boolean;

    constructor(raw: RawRecord, key: string, section: number = 0) {
        this.raw = raw;
        const sid = section;
        this.sid = sid;
        this.key = key;
        this.id = raw[0][sid];
        this.department = raw[1];
        this.number = raw[2];
        this.section = raw[3][sid];
        this.type = isNaN(+raw[4]) ? raw[4] : CourseRecord.TYPES[raw[4]];
        this.units = raw[5];
        this.instructor = raw[6][sid];
        this.days = raw[7][sid];
        this.room = raw[8][sid];
        this.title = raw[9];
        this.topic = raw[10][sid];
        this.status = isNaN(+raw[11][sid]) ? raw[11][sid] : CourseRecord.STATUSES[raw[11][sid]];
        this.enrollment = raw[12][sid];
        this.enrollment_limit = raw[13][sid];
        this.wait_list = raw[14][sid];
        this.description = raw[15];

        // only used in schedule rendering
        this.backgroundColor = 'white';
        this.start = '';
        this.end = '';

        // whether is the default section
        this.default = true;
    }

    public copy(): Course {
        const cp = new Course(this.raw, this.key, this.sid);
        cp.backgroundColor = this.backgroundColor;
        cp.start = this.start;
        cp.end = this.end;
        cp.default = this.default;
        return cp;
    }
    /**
     * compute the hash of this course using its key
     */
    public hash() {
        return Course.hashCode(this.key);
    }
}

export default Course;
