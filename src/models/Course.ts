/**
 * @author Hanzhi Zhou
 * @module src/models
 */

/**
 *
 */
import { CourseType } from '../config';
import { hashCode } from '../utils';
import Hashable from './Hashable';
import Section from './Section';

/**
 * represents all public information of a Course
 */
export interface CourseFields {
    /**
     * the key of the course. must be globally unique for all courses, e.g. cs11105
     * composed of three parts:
     * 1. lowercase department letter, e.g. cs
     * 2. course number, e.g. 1110
     * 3. course type index, e.g. 5., corresponding to [[TYPES]]
     */
    readonly key: string;
    /**
     * department name, short form, all capitalized. e.g `CS`
     */
    readonly department: string;
    /**
     * Course number, e.g. `2150`
     */
    readonly number: number;
    /**
     * One of the keys of [[TYPES_PARSE]]
     */
    readonly type: string;
    /**
     * Units (credits), usually a number, but could be a range represented as a string like value
     * @example
     * "1", "3", "2.5", "1 - 12"
     */
    readonly units: string;
    /**
     * one line title for the course, e.g. "Principle of Microeconomics"
     */
    readonly title: string;
    /**
     * a full description of the course
     */
    readonly description: string;
}

/**
 * a match result (from searcher)
 * @typeparam T the field name of the course/section that matches the search query
 */
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

/**
 * the model of a Course that has multiple sections. A Course object may have all or a subset of the sections,
 * depending on the array of section indices passed to its constructor.
 *
 * All course instances are immutable
 */
export default class Course implements CourseFields, Hashable {
    public readonly key: string;
    public readonly department: string;
    public readonly number: number;
    public readonly type: CourseType;
    public readonly units: string;
    public readonly title: string;
    public readonly description: string;

    /**
     * Array of sections contained in this object.
     * Can be all sections or a subset or the sections. This property is **non-enumerable**
     */
    public readonly sections: Section[];

    /**
     * this constructor is only used to create a copy of a course with all or a selected subset of sections.
     * Original course instances are created through `Object.create` and are not constructed by this constructor.
     * @param course the full-course that will be copied
     * @param ids A list of section indices for specifying the subset of sections contained in this course
     */
    constructor(course: Course, public readonly ids: number[]) {
        this.key = course.key;
        this.department = course.department;
        this.number = course.number;
        this.type = course.type;
        this.units = course.units;
        this.title = course.title;
        this.description = course.description;
        this.sections = ids.map(id => {
            const sec = course.sections.find(s => s.id === id);
            if (!sec) throw new Error('Non-existent id ' + id);
            return sec;
        })
    }
    /**
     * human readable name for this course, e.g. ECON 2010 Lecture
     */
    get displayName() {
        return `${this.department} ${this.number} ${this.type}`;
    }
    get displayNameNoType() {
        return `${this.department} ${this.number}`;
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
     * value is the array of section contained in this Course occurring at that time.
     * For example:
     * ```js
     * {"08/27/2019 - 12/17/2019|MoTu 11:00AM-11:50AM|Fr 10:00AM - 10:50AM" : [...Sections]}
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
    public has(element: Section): boolean {
        return this.key === element.key && this.ids.includes(element.id);
    }
}
