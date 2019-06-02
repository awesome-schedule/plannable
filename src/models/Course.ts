/**
 * @author Hanzhi Zhou
 * @module models
 */

/**
 *
 */
import Section, { SectionMatch } from './Section';
import { RawCourse, CourseType, TYPES } from './Meta';
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

    /**
     * display name, e.g. ECON 2010 Lecture for courses and ECON 2010-001 Lecture for sections
     */
    readonly displayName: string;
}

export interface Match<T extends string> {
    readonly match: T;
    readonly start: number;
    readonly end: number;
}

export type CourseMatch = Match<'title' | 'description' | 'key'>;

/**
 * the model of a Course that has multiple sections. A Course object may have all or a subset of the sections,
 * depending on the array of section indices passed to its constructor.
 */
export default class Course implements CourseFields, Hashable {
    public readonly department: string;
    public readonly number: number;
    public readonly type: CourseType;
    public readonly units: string;
    public readonly title: string;
    public readonly description: string;

    /**
     * Array of section ids contained in this object, sorted in ascending order.
     * Can be all sections of a subset or the sections
     */
    public readonly sids: number[];
    public readonly sections: Section[];

    /**
     * @param raw the raw representation of this course
     * @param key the key of this course, e.g. cs11105
     * equal to (department + number + `Meta.TYPES_PARSE`\[type\]). see [[Meta.TYPES_PARSE]]
     * @param sids A list of section indices
     * @param matches matches for this course
     * @param secMatches matches for the sections contained in this course
     */
    constructor(
        public readonly raw: RawCourse,
        public readonly key: string,
        sids: ReadonlyArray<number> = [],
        public readonly matches: CourseMatch[] = [],
        secMatches: SectionMatch[][] = []
    ) {
        if (sids.length) {
            this.sids = sids.slice().sort();
        } else {
            this.sids = Array.from({ length: raw[6].length }, (_, i) => i);
        }

        this.department = raw[0];
        this.number = raw[1];
        this.type = TYPES[raw[2]];
        this.units = raw[3];
        this.title = raw[4];
        this.description = raw[5];
        this.matches = matches;

        if (secMatches.length === this.sids.length) {
            this.sections = this.sids.map((sid, idx) => new Section(this, sid, secMatches[idx]));
        } else {
            this.sections = this.sids.map(sid => new Section(this, sid));
        }
    }

    get displayName() {
        return this.department + ' ' + this.number + ' ' + this.type;
    }

    /**
     * get the first section **contained** in this course
     */
    public getFirstSection() {
        return this.sections[0];
    }

    public addSectionMatches(sids: number[], secMatches: SectionMatch[][]) {
        sids = sids.filter((sid, idx) => {
            const exIdx = this.sids.findIndex(s => s === sid);
            if (exIdx === -1) return true;
            else {
                this.sections[exIdx].matches.push(...secMatches[idx]);
                (secMatches[idx] as any) = null;
                return false;
            }
        });
        secMatches = secMatches.filter(x => x);
        this.sections.push(...sids.map((i, idx) => new Section(this, i, secMatches[idx])));
        this.sections.sort((a, b) => a.sid - b.sid);
        this.sids.push(...sids);
        this.sids.sort();
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

    /**
     * get copy of this course, with no match contained
     */
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
