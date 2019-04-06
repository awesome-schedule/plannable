import Section from './Section';
import Meta, { RawCourse } from './Meta';

export interface CourseFields {
    department: string;
    number: number;
    type: string;
    units: number;
    title: string;
    description: string;
}

class Course implements CourseFields {
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

    [x: string]: any;
    public key: string;
    public readonly department: string;
    public readonly number: number;
    public readonly type: string;
    public readonly units: number;
    public readonly title: string;
    public readonly description: string;

    public readonly raw: RawCourse;
    /**
     * array of section ids contained in this object
     */
    public readonly sids: number[];
    public readonly sections: Section[];

    /**
     * @param sids A list of section indices
     */
    constructor(raw: RawCourse, key: string, sids: number[] = []) {
        this.key = key;
        this.raw = raw;

        this.department = raw[0];
        this.number = raw[1];
        this.type = Meta.TYPES[raw[2]];
        this.units = raw[3];
        this.title = raw[4];
        this.description = raw[5];

        if (sids.length > 0) {
            sids.sort();
            this.sids = sids;
            this.sections = sids.map(i => new Section(this, raw[6][i], i));
        } else {
            this.sids = Array.from({ length: raw[6].length }, (_, i) => i);
            this.sections = raw[6].map((x, i) => new Section(this, x, i));
        }
    }

    /**
     * Get the course of a given section.
     * Note that **it is possible** to get a Course whose section index
     * is not in the subset of sections contained in this instance
     */
    public getSection(sid: number): Section {
        return new Section(this, this.raw[6][sid], sid);
    }

    /**
     * Get the CourseRecord at a given range of sections
     */
    public getCourse(sids: number[]): Course {
        return new Course(this.raw, this.key, sids);
    }

    /**
     * whether all sections of this CourseRecord occur at the same time
     */
    public allSameTime(): boolean {
        const sections = this.sections;
        for (let i = 0; i < sections.length - 1; i++) {
            if (!sections[i].sameTimeAs(sections[i + 1])) return false;
        }
        return true;
    }

    /**
     * Get an object in which the key is the days string and
     * value is the subset of sections contained in this Course occurring at that time
     *
     * e.g. {"MoTu 11:00AM-11:50AM|Fr 10:00AM - 10:50AM" : array of section indices }
     */
    public getCombined() {
        const combined: { [x: string]: number[] } = {};
        for (let i = 0; i < this.sections.length; i++) {
            const day = this.sections[i].combinedTime();
            if (combined[day]) combined[day].push(this.sids[i]);
            else combined[day] = [this.sids[i]];
        }
        return combined;
    }

    public hash() {
        return Course.hashCode(this.key + this.sids.toString());
    }

    public copy() {
        return new Course(this.raw, this.key, this.sids);
    }

    public equals(object: object): boolean {
        if (object instanceof Course) {
            return this.key === object.key && this.sids.toString() === object.sids.toString();
        }
        return false;
    }
}

export default Course;
