/**
 * the model of a Course that has multiple sections
 * @author Hanzhi Zhou
 */

/**
 *
 */
import Section, { SectionMatch } from './Section';
import Meta, { RawCourse, CourseType } from './Meta';
import Hashable from './Hashable';
import { hashCode } from '../utils';

/**
 * represents all public information of a Course
 */
export interface CourseFields {
    /**
     * department name, short form, all capitalized. e.g `CS`
     */
    readonly department: string;
    /**
     * Course number, e.g. `2150`
     */
    readonly number: number;
    /**
     * One of the keys of `Meta.TYPES_PARSE`
     *
     * @see [[Meta.TYPES_PARSE]]
     */
    readonly type: string;
    /**
     * Units (credits), usually a number, but could be a range represented as a string like value
     *
     * @example
     * "1", "3", "2.5", "1 - 12"
     */
    readonly units: string;
    readonly title: string;
    readonly description: string;
}

export interface Match<T extends string> {
    match: T;
    start: number;
    end: number;
}

export type CourseMatch = Match<'title' | 'description' | 'key'>;

/**
 * the model of a Course that has multiple sections. A Course object may have all or a subset of the sections,
 * depending on the array of section indices passed to its constructor.
 */
export default class Course implements CourseFields, Hashable {
    [x: string]: any;
    /**
     * key of this in Catalog, equal to (department + number + `Meta.TYPES_PARSE`\[type\])
     *
     * @see [[Meta.TYPES_PARSE]]
     */
    public readonly key: string;
    public readonly department: string;
    public readonly number: number;
    public readonly type: CourseType;
    public readonly units: string;
    public readonly title: string;
    public readonly description: string;

    public readonly raw: RawCourse | undefined;
    /**
     * Array of section ids contained in this object, sorted in ascending order.
     * Can be all sections of a subset or the sections
     */
    public readonly sids: number[];
    public readonly sections: Section[];

    public readonly isFake: boolean;
    public readonly hasFakeSections: boolean;
    public readonly match?: CourseMatch;

    /**
     * @param raw the raw representation of this course
     * @param key the key of this course, e.g. cs11105
     * @param sids A list of section indices
     */
    constructor(
        raw: RawCourse | undefined,
        key: string,
        sids: number[] = [],
        match?: CourseMatch,
        secMatches: SectionMatch[] = []
    ) {
        this.key = key;
        this.raw = raw;

        if (sids.length) {
            this.sids = sids.sort();
        } else {
            this.sids = raw ? Array.from({ length: raw[6].length }, (_, i) => i) : [];
        }

        if (raw) {
            this.department = raw[0];
            this.number = raw[1];
            this.type = Meta.TYPES[raw[2]];
            this.units = raw[3];
            this.title = raw[4];
            this.description = raw[5];

            if (secMatches.length === this.sids.length) {
                this.sections = this.sids.map(
                    (i, idx) => new Section(this, raw[6][i], i, secMatches[idx])
                );
            } else {
                this.sections = this.sids.map(i => new Section(this, raw[6][i], i));
            }

            this.hasFakeSections = this.sections.some(s => s.isFake);
            this.isFake = false;
        } else {
            // try to convert the key to a more readable format
            const regex = /([a-z]{1,5})([0-9]{4})(.*)/i;
            const parts = key.match(regex);
            if (parts) {
                const [_, dept, num, type] = parts;
                this.department = dept.toUpperCase();
                this.number = +num;
                this.type = Meta.TYPES[+type];
            } else {
                this.department = '?';
                this.number = 0;
                this.type = '';
            }
            this.units = '';
            this.title = 'NOT EXIST!';
            this.description = '';
            this.sections = [];
            this.hasFakeSections = false;
            this.isFake = true;
        }
        this.match = match;
    }

    /**
     * Get the course of a given section.
     * @param contained By letting contained = false, **it will be possible** to get a Course whose section index
     * is not in the subset of sections contained in this instance
     */
    public getSection(sid: number, contained = false): Section {
        if (contained) {
            return this.sections[sid];
        } else {
            if (!this.raw) throw new Error(this.key + ' is a dummy course!');
            return new Section(this, this.raw[6][sid], sid);
        }
    }

    /**
     * get the first section **contained** in this course
     */
    public getFirstSection() {
        return this.getSection(0, true);
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
     * value is the array of section indices contained in this Course occurring at that time.
     * For example:
     * ```js
     * {"MoTu 11:00AM-11:50AM|Fr 10:00AM - 10:50AM" : [1,2,3,7,9]}
     * ```
     */
    public getCombined(): { [x: string]: Section[] } {
        const combined: { [x: string]: Section[] } = {};
        for (const section of this.sections) {
            const day = section.combinedTime();
            if (combined[day]) combined[day].push(section);
            else combined[day] = [section];
        }
        return combined;
    }

    /**
     * Returns a 32-bit integer hash for this Course.
     * Hashes are different if the sections contained in this course are different
     */
    public hash() {
        return hashCode(this.key);
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

    /**
     * check whether the section is contained in this course
     */
    public has(section: Section): boolean;
    /**
     * check whether the set of sections indices with the given key
     * exist in the section array contained in this course
     * @param sections the Set of section indices
     * @param key the key of the section
     */
    public has(sections: Set<number>, key: string): boolean;
    public has(element: Section | Set<number>, key?: string): boolean {
        if (element instanceof Set) {
            return this.key === key && this.sids.some(sid => element.has(sid));
        } else {
            return this.key === element.key && this.sids.includes(element.sid);
        }
    }
}
