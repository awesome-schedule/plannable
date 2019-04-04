import Course from './Course';
import { RawRecord } from './AllRecords';

class CourseRecord {
    /**
     * lecture type number => meaning
     */
    public static readonly TYPES: { [x: number]: string } = Object.freeze({
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
    });

    /**
     * status number => meaning
     */
    public static readonly STATUSES: { [x: number]: string } = Object.freeze({
        '-1': 'TBA',
        1: 'Open',
        0: 'Closed',
        2: 'Wait List'
    });

    public static readonly FIELDS: { [x: number]: string } = Object.freeze({
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
    });

    // maybe do this using enum?
    public static readonly TYPES_PARSE: { [x: string]: number } = Object.freeze({
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
    });

    public static readonly STATUSES_PARSE: { [x: string]: number } = Object.freeze({
        Open: 1,
        Closed: 0,
        'Wait List': 2
    });

    /**
     * The list of indices at which the field is a list
     */
    public static readonly LIST = [0, 3, 6, 7, 8, 10, 11, 12, 13, 14];

    public static readonly LENGTH = 16;

    public static readonly PARSE_FUNC = [
        Number,
        null,
        Number,
        null,
        (x: string) => {
            const temp = CourseRecord.TYPES_PARSE[x];
            return temp ? temp : -1;
        },
        Number,
        (x: string) => x.split(','),
        null,
        null,
        null,
        null,
        (x: string) => {
            const temp = CourseRecord.STATUSES_PARSE[x];
            return temp ? temp : -1;
        },
        Number,
        Number,
        Number,
        null
    ];
    [x: string]: any;
    public key: string;
    public raw: RawRecord;
    /**
     * array of section ids contained in this object
     */
    public sids: number[];

    public id: number[];
    public department: string;
    public number: number;
    /**
     * The section string as recorded in Lou's list. It is DIFFERENT from sids.
     */
    public section: string[];
    public type: any;
    public units: number;
    public instructor: string[][];
    public days: string[];
    public room: string[];
    public title: string;
    public topic: string[];
    public status: any[];
    public enrollment: number[];
    public enrollment_limit: number[];
    public wait_list: number[];
    public description: string;
    /**
     * @param sids A list of section indices
     */
    constructor(raw: RawRecord, key: string, sids: number[] = []) {
        this.key = key;
        this.raw = raw;

        this.id = raw[0];
        this.department = raw[1];
        this.number = raw[2];
        this.section = raw[3];
        this.type = CourseRecord.TYPES[raw[4]];
        this.units = raw[5];
        this.instructor = raw[6];
        this.days = raw[7];
        this.room = raw[8];
        this.title = raw[9];
        this.topic = raw[10];
        this.status = raw[11].map(status => CourseRecord.STATUSES[status]);
        this.enrollment = raw[12];
        this.enrollment_limit = raw[13];
        this.wait_list = raw[14];
        this.description = raw[15];

        if (sids.length > 0) {
            sids.sort();
            this.sids = sids;
            for (const i of CourseRecord.LIST) {
                const field = CourseRecord.FIELDS[i];
                this[field] = [];
                for (const idx of sids) {
                    const s: any = raw[i];
                    this[field].push(s[idx]);
                }
            }
        } else {
            this.sids = Array.from({ length: this.section.length }, (_, i) => i);
        }
    }

    /**
     * Get the course of a given section.
     * Note that **it is possible** to get a Course whose section index
     * is not in the subset of sections contained in this instance
     */
    public getCourse(sid: number): Course {
        return new Course(this.raw, this.key, sid);
    }

    /**
     * Get the CourseRecord at a given range of sections
     */
    public getRecord(sids: number[]): CourseRecord {
        return new CourseRecord(this.raw, this.key, sids);
    }

    /**
     * whether all sections of this CourseRecord occur at the same time
     */
    public allSameTime(): boolean {
        for (let i = 0; i < this.days.length - 1; i++) {
            if (this.days[i] !== this.days[i + 1]) return false;
        }
        return true;
    }

    /**
     * Get an object where the key is the days string and
     * value is the subset of sections contained in this CourseRecord occurring at that time
     */
    public getCombined() {
        const combined: { [x: string]: number[] } = {};
        for (let i = 0; i < this.days.length; i++) {
            const day = this.days[i];
            if (combined[day]) combined[day].push(this.sids[i]);
            else combined[day] = [this.sids[i]];
        }
        return combined;
    }

    public hash() {
        return Course.hashCode(this.key + this.sids.toString());
    }

    public copy() {
        return new CourseRecord(this.raw, this.key, this.sids);
    }

    public equals(object: object): boolean {
        if (object instanceof CourseRecord) {
            return this.key === object.key && this.sids.toString() === object.sids.toString();
        }
        return false;
    }
}

export default CourseRecord;
