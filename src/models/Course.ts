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
    /**
     * start index of the match
     */
    readonly start: number;
    /**
     * end index + 1 of the match
     */
    readonly end: number;
}

type CourseMatchField = 'title' | 'description' | 'key';
export type CourseMatch<T extends CourseMatchField = CourseMatchField> = Match<T>;
export type CourseConstructorArguments = ConstructorParameters<typeof Course>;

const matchSortFunc = (a: Match<any>, b: Match<any>) => a.start - b.start;

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
    public readonly sids: ReadonlyArray<number>;
    public readonly sections: ReadonlyArray<Section>;
    public readonly matches: ReadonlyArray<CourseMatch>;

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
        matches: ReadonlyArray<CourseMatch> = [],
        public readonly secMatches: ReadonlyArray<ReadonlyArray<SectionMatch>> = []
    ) {
        if (sids.length) {
            this.sids = sids.slice().sort((a, b) => a - b);
        } else {
            this.sids = Array.from({ length: raw[6].length }, (_, i) => i);
        }

        this.department = raw[0];
        this.number = raw[1];
        this.type = TYPES[raw[2]];
        this.units = raw[3];
        this.title = raw[4];
        this.description = raw[5];
        this.matches = matches.concat().sort(matchSortFunc);

        if (secMatches.length === this.sids.length) {
            this.sections = this.sids.map(
                (sid, idx) => new Section(this, sid, secMatches[idx].concat().sort(matchSortFunc))
            );
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

    public addMatch(match: CourseMatch) {
        const matches = this.matches.concat();
        matches.push(match);
        return new Course(this.raw, this.key, this.sids, matches, this.secMatches);
    }

    public addSectionMatches(sids: number[], secMatches: SectionMatch[][]) {
        const newSecMatches = this.secMatches.map(x => x.concat());
        const newSids = this.sids.concat();

        const zipped = sids
            .map((x, i) => [x, secMatches[i]] as [number, SectionMatch[]])
            .filter(([sid, matches]) => {
                const exIdx = newSids.findIndex(s => s === sid);
                if (exIdx === -1) return true;
                else {
                    newSecMatches[exIdx].push(...matches);
                    return false;
                }
            });

        for (const [sid, matches] of zipped) {
            let j = 0;
            for (; j < newSids.length; j++) if (sid < newSids[j]) break;

            newSids.splice(j, 0, sid);
            newSecMatches.splice(j, 0, matches);
        }
        return new Course(this.raw, this.key, newSids, this.matches, newSecMatches);
    }

    /**
     * Get the CourseRecord at a given range of sections
     */
    public getCourse(sids: number[]) {
        return new Course(this.raw, this.key, sids);
    }

    /**
     * whether all sections of this Course occur at the same time
     */
    public allSameTime() {
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
    public getCombined() {
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

    public equals(object: object) {
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
