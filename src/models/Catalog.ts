// note: this is the description for the entire module.
/**
 * models and data structures used across the website
 * @module models
 * @preferred
 */

/**
 * @author Hanzhi Zhou
 */

/**
 *
 */
import Course, { Match } from './Course';
import { RawCatalog, RawCourse, TYPES } from './Meta';
import Expirable from '../data/Expirable';
import Schedule from './Schedule';
import Meeting from './Meeting';
import Fuse from 'fuse.js';

interface FuseMatch {
    indices: [number, number][];
    value: string;
    key: string;
    arrayIndex: number;
}
// import Worker from 'worker-loader!./SearchWorker.ts';

/**
 * represents a semester
 */
export interface SemesterJSON {
    /**
     * semester id, e.g. `1198`
     */
    readonly id: string;
    /**
     * semester name, e.g. Fall 2019
     */
    readonly name: string;
}

export interface CatalogJSON extends Expirable {
    semester: SemesterJSON;
    raw_data: RawCatalog;
}

/**
 * Catalog wraps the raw data of a semester, providing methods to access and search for courses/sections
 */
export default class Catalog {
    /**
     * Parse AllRecords from parsed JSON
     */
    public static fromJSON(data: CatalogJSON) {
        return new Catalog(data.semester, data.raw_data, data.modified);
    }
    /**
     * the semester corresponding to the catalog stored in this object
     */
    public semester: SemesterJSON;
    /**
     * the raw representation of the course catalog
     * @borrows python's snake_case (not changed due to backward compatibility issues)
     */
    public raw_data: RawCatalog;
    public modified: string;

    private keys: string[];
    private values: RawCourse[];
    private courseDict: { [x: string]: Course } = {};
    private courses: Course[];
    private fuse: Fuse<
        Course,
        {
            shouldSort: true;
            includeMatches: true;
            threshold: number;
            location: number;
            distance: number;
            maxPatternLength: number;
            minMatchCharLength: number;
            keys: string[];
        }
    >;

    constructor(semester: SemesterJSON, raw_data: RawCatalog, modified: string) {
        this.semester = semester;
        this.raw_data = raw_data;
        this.modified = modified;

        console.time('catalog prep data');
        const keys = Object.keys(this.raw_data);
        const values = Object.values(this.raw_data);
        const len = keys.length;
        const courses = [];
        for (let i = 0; i < len; i++) {
            const key = keys[i];
            const c = new Course(values[i], key);
            courses.push((this.courseDict[key] = c));
        }
        this.courses = courses;
        this.keys = keys;
        this.values = values;

        this.fuse = new Fuse(this.courses, {
            shouldSort: true,
            includeMatches: true,
            threshold: 0.5,
            location: 0,
            distance: 100,
            maxPatternLength: 32,
            minMatchCharLength: 3,
            keys: ['title', 'description', 'sections.topic', 'sections.instructors']
        });
        console.timeEnd('catalog prep data');
    }

    public fromJSON(data: CatalogJSON) {
        return Catalog.fromJSON(data);
    }

    public toJSON(): CatalogJSON {
        return {
            semester: this.semester,
            raw_data: this.raw_data,
            modified: this.modified
        };
    }

    /**
     * Get a Course associated with the given key
     *
     * you may specify a set of section indices so that you can
     * only obtain a subset of the original course sections
     */
    public getCourse(key: string, sections?: Set<number> | -1) {
        const course = this.courseDict[key] || new Course(undefined, key);
        if (!sections || sections === -1) return course;
        else return course.getCourse([...sections.values()]);
    }

    /**
     * Get a Course associated with the given key and section index
     */
    public getSection(key: string, section = 0) {
        const course = this.courseDict[key];
        if (course) return course.getSection(section);
        else throw new Error('non-existent key ' + key);
    }

    /**
     * convert `cs11105` style key to `CS 1110 Lecture`
     *
     * convert key of an event (e.g. `MoFr 1:00PM - 2:00PM`) to its title
     */
    convertKey(key: string, schedule?: Schedule) {
        const raw = this.raw_data[key];
        if (raw) return `${raw[0]} ${raw[1]} ${TYPES[raw[2]]}`;
        else if (schedule) {
            for (const event of schedule.events) {
                if (event.key === key) {
                    return event.title === '' ? key : event.title;
                }
            }
        }
        return key;
    }

    public fuzzySearch(query: string) {
        const results = this.fuse.search(query).slice(0, 10);
        const courses = [];
        for (const result of results) {
            const { item, matches } = result;
            const courseMatches: Match<any>[] = [];
            const sectionMatches: { [x: number]: Match<any>[] } = [];
            for (const match of matches as FuseMatch[]) {
                const idx = match.key.indexOf('.');
                for (const indices of match.indices) {
                    console.assert(indices[1] > indices[0]);
                    if (idx === -1) {
                        courseMatches.push({
                            match: match.key,
                            start: indices[0],
                            end: indices[1] + 1
                        });
                    } else {
                        const arrIdx = match.arrayIndex;
                        const obj = {
                            match: match.key.substring(idx + 1),
                            start: indices[0],
                            end: indices[1] + 1
                        };
                        if (sectionMatches[arrIdx]) {
                            sectionMatches[arrIdx].push(obj);
                        } else {
                            sectionMatches[arrIdx] = [obj];
                        }
                    }
                }
            }
            console.log(result);
            const secEntries = Object.entries(sectionMatches).sort((a, b) => +a[0] - +b[0]);
            courses.push(
                new Course(
                    item.raw,
                    item.key,
                    secEntries.map(x => +x[0]),
                    courseMatches,
                    secEntries.map(x => x[1])
                )
            );
            if (courses.length > 10) break;
        }
        return courses;
    }

    /**
     * Perform a linear search in the catalog against
     * course number, title, topic, professor name and description, in the order specified.
     * @param query
     * @param max_results
     */
    public search(query: string, max_results = 6) {
        query = query.trim().toLowerCase();
        const temp = query.split(' ');
        /**
         * is special search
         */
        const spec = query.startsWith(':') && temp.length > 1;
        let field: string = '';
        /**
         * query no space
         */
        let queryNoSp: string;
        if (spec) {
            field = temp[0].substring(1);
            queryNoSp = temp.slice(1).join('');
            query = temp.slice(1).join(' ');
        } else {
            queryNoSp = temp.join('');
        }

        const matches: Course[] = [];

        const keys = this.keys;
        const len = keys.length;
        const values = this.values;

        if (!spec || field === 'num' || field === 'key')
            for (let i = 0; i < len; i++) {
                this.searchKey(keys[i], queryNoSp, values[i], matches);
                if (matches.length >= max_results) return matches;
            }

        if (!spec || field === 'title')
            for (let i = 0; i < len; i++) {
                this.searchTitle(keys[i], query, values[i], matches);
                if (matches.length >= max_results) return matches;
            }

        if (!spec || field === 'topic')
            for (let i = 0; i < len; i++) {
                this.searchTopic(keys[i], query, values[i], matches);
                if (matches.length >= max_results) return matches;
            }

        if (!spec || field === 'prof')
            for (let i = 0; i < len; i++) {
                this.searchProf(keys[i], query, values[i], matches);
                if (matches.length >= max_results) return matches;
            }

        if (!spec || field === 'desc')
            for (let i = 0; i < len; i++) {
                this.searchDesc(keys[i], query, values[i], matches);
                if (matches.length >= max_results) return matches;
            }
        return matches;
    }

    private searchKey(key: string, queryNoSp: string, course: RawCourse, results: Course[]) {
        const keyIdx = key.indexOf(queryNoSp);
        // match with the course number
        if (keyIdx !== -1) {
            const deptLen = course[0].length;
            const end = keyIdx + queryNoSp.length;
            results.push(
                new Course(
                    course,
                    key,
                    [],
                    [
                        {
                            match: 'key',
                            start: keyIdx + +(keyIdx >= deptLen),
                            end: end + +(end > deptLen)
                        }
                    ]
                )
            );
        }
    }

    private searchTitle(key: string, query: string, course: RawCourse, results: Course[]) {
        const title = course[4].toLowerCase();
        const titleIdx = title.indexOf(query);
        if (titleIdx !== -1 && !results.find(x => x.key === key)) {
            results.push(
                new Course(
                    course,
                    key,
                    [],
                    [
                        {
                            match: 'title',
                            start: titleIdx,
                            end: titleIdx + query.length
                        }
                    ]
                )
            );
        }
    }

    private searchTopic(key: string, query: string, course: RawCourse, results: Course[]) {
        // check any topic/professor match. Select the sections which only match the topic/professor
        const topicMatchIdx = [];
        const topicMatches: [Match<'topic'>][] = [];
        const sections = course[6];
        for (let i = 0; i < sections.length; i++) {
            const topic = sections[i][2];
            const topicIdx = topic.toLowerCase().indexOf(query);
            if (topicIdx !== -1) {
                topicMatchIdx.push(i);
                topicMatches.push([
                    {
                        match: 'topic',
                        start: topicIdx,
                        end: topicIdx + query.length
                    }
                ]);
            }
        }
        if (topicMatchIdx.length && !results.find(x => x.key === key))
            results.push(new Course(course, key, topicMatchIdx, undefined, topicMatches));
    }

    private searchProf(key: string, query: string, course: RawCourse, results: Course[]) {
        // check any topic/professor match. Select the sections which only match the topic/professor
        const profMatchIdx = [];
        const profMatches: [Match<'instructors'>][] = [];
        const sections = course[6];
        for (let i = 0; i < sections.length; i++) {
            const profs = Meeting.getInstructors(sections[i][7])
                .join(', ')
                .toLowerCase();
            const profIdx = profs.indexOf(query);
            if (profIdx !== -1) {
                profMatchIdx.push(i);
                profMatches.push([
                    {
                        match: 'instructors',
                        start: profIdx,
                        end: profIdx + query.length
                    }
                ]);
            }
        }
        if (profMatchIdx.length && !results.find(x => x.key === key))
            results.push(new Course(course, key, profMatchIdx, undefined, profMatches));
    }

    private searchDesc(key: string, query: string, course: RawCourse, results: Course[]) {
        const desc = course[5].toLowerCase();
        const descIdx = desc.indexOf(query);
        // lastly, check description match
        if (descIdx !== -1 && !results.find(x => x.key === key)) {
            results.push(
                new Course(
                    course,
                    key,
                    [],
                    [
                        {
                            match: 'description',
                            start: descIdx,
                            end: descIdx + query.length
                        }
                    ]
                )
            );
        }
    }
}
