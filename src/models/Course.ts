import Section from './Section';
import Meta, { RawCourse } from './Meta';
import Hashable from './Hashable';
import { hashCode } from './Utils';

/**
 * Represents all public information of a Course
 */
export interface CourseFields {
    /**
     * department name, short form, all capitalized. e.g `CS`
     */
    department: string;
    /**
     * Course number, e.g. `2150`
     */
    number: number;
    /**
     * One of the keys of `Meta.TYPE_PARSE`
     *
     * @see Meta.TYPE_PARSE
     */
    type: string;
    /**
     * Units (credits), usually a number, but could be a range represented as a string like
     *
     * @example
     * "1", "3", "2.5", "1 - 12"
     */
    units: string;
    title: string;
    description: string;
}

class Course implements CourseFields, Hashable {
    [x: string]: any;
    /**
     * key of this in Catalog, equal to (department + number + `Meta.TYPES_PARSE`\[type\])
     */
    public key: string;
    public readonly department: string;
    public readonly number: number;
    public readonly type: string;
    public readonly units: string;
    public readonly title: string;
    public readonly description: string;

    public readonly raw: RawCourse;
    /**
     * Array of section ids contained in this object.
     * Can be all sections of a subset or the sections
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
     * whether all sections of this Course occur at the same time
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
     * value is the array of section indices contained in this Course occurring at that time
     *
     * @example
     * {"MoTu 11:00AM-11:50AM|Fr 10:00AM - 10:50AM" : [1,2,3,7,9]}`
     */
    public getCombined(): { [x: string]: Section[] } {
        const combined: { [x: string]: Section[] } = {};
        for (let i = 0; i < this.sections.length; i++) {
            const day = this.sections[i].combinedTime();
            if (combined[day]) combined[day].push(this.sections[i]);
            else combined[day] = [this.sections[i]];
        }
        return combined;
    }

    public hash() {
        return hashCode(this.key + this.sids.toString());
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
