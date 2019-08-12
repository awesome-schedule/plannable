/**
 * @author Hanzhi Zhou
 * @module models
 */

/**
 *
 */
import { hashCode } from '../utils';
import Hashable from './Hashable';
import { CourseType } from './Meta';
import Section from './Section';

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
     * One of the keys of [[Meta.TYPES_PARSE]]
     */
    readonly type: string;
    /**
     * Units (credits), usually a number, but could be a range represented as a string like value
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

/**
 * the model of a Course that has multiple sections. A Course object may have all or a subset of the sections,
 * depending on the array of section indices passed to its constructor.
 *
 * All course instances are immutable
 */
export default class Course implements CourseFields, Hashable {
    public readonly department: string;
    public readonly number: number;
    public readonly type: CourseType;
    public readonly units: string;
    public readonly title: string;
    public readonly description: string;

    public readonly key: string;
    /**
     * Array of section ids contained in this object, sorted in ascending order.
     * Can be all sections of a subset or the sections
     */
    public readonly sections: Section[];
    public readonly isSubset: boolean;

    /**
     * @param raw the raw representation of this course
     * @param key the key of this course, e.g. cs11105
     * equal to (department + number + `Meta.TYPES_PARSE`\[type\]). see [[Meta.TYPES_PARSE]]
     * @param ids A list of section indices
     */
    constructor(course: Course, public readonly ids: number[]) {
        this.key = course.key;
        this.department = course.department;
        this.number = course.number;
        this.type = course.type;
        this.units = course.units;
        this.title = course.title;
        this.description = course.description;
        this.sections = ids.reduce((acc: Section[], id) => {
            const sec = course.sections.find(s => s.id === id);
            if (!sec) throw new Error('Non-existent id ' + id);
            acc.push(sec);
            return acc;
        }, []);
        this.isSubset = true;
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

    /**
     * Get the Course containing only the given sections
     */
    public getCourse(ids: number[]) {
        return new Course(this, ids);
    }

    public getSectionById(id: number) {
        const sec = this.sections.find(s => s.id === id);
        if (!sec) throw new Error('Non-existent id ' + id);
        return sec;
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
     * Get an object in which the key is the date string + days and
     * value is the array of section indices contained in this Course occurring at that time.
     * For example:
     * ```js
     * {"08/27/2019 - 12/17/2019|MoTu 11:00AM-11:50AM|Fr 10:00AM - 10:50AM" : [1,2,3,7,9]}
     * ```
     */
    public getCombined() {
        const combined: { [x: string]: Section[] } = {};
        for (const section of this.sections) {
            const str = section.combinedTime();
            if (combined[str]) combined[str].push(section);
            else combined[str] = [section];
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

    public equals(object: object) {
        if (object instanceof Course) {
            return this.key === object.key && this.ids.toString() === object.ids.toString();
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
            return this.key === key && this.ids.some(id => element.has(id));
        } else {
            return this.key === element.key && this.ids.includes(element.id);
        }
    }
}
