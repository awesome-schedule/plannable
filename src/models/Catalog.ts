/**
 * @author Hanzhi Zhou
 * @module models
 */

/**
 *
 */
import Course, { Match } from './Course';
import Meta, { RawCatalog, RawCourse } from './Meta';
import Expirable from '../data/Expirable';
import Schedule from './Schedule';
import Meeting from './Meeting';

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

    constructor(semester: SemesterJSON, raw_data: RawCatalog, modified: string) {
        this.semester = semester;
        this.raw_data = raw_data;
        this.modified = modified;

        this.keys = Object.keys(this.raw_data);
        this.values = Object.values(this.raw_data);
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
        if (!sections) return new Course(this.raw_data[key], key);
        else if (sections === -1) return new Course(this.raw_data[key], key);
        else return new Course(this.raw_data[key], key, [...sections.values()]);
    }

    /**
     * Get a Course associated with the given key and section index
     */
    public getSection(key: string, section = 0) {
        return new Course(this.raw_data[key], key).getSection(section);
    }

    /**
     * convert `cs11105` style key to `CS 1110 Lecture`
     *
     * convert key of an event (e.g. `MoFr 1:00PM - 2:00PM`) to its title
     */
    convertKey(key: string, schedule?: Schedule) {
        const raw = this.raw_data[key];
        if (raw) return `${raw[0]} ${raw[1]} ${Meta.TYPES[raw[2]]}`;
        else if (schedule) {
            for (const event of schedule.events) {
                if (event.key === key) {
                    return event.title === '' ? key : event.title;
                }
            }
        }
        return key;
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
                new Course(course, key, [], {
                    match: 'key',
                    start: keyIdx + +(keyIdx >= deptLen),
                    end: end + +(end > deptLen)
                })
            );
        }
    }

    private searchTitle(key: string, query: string, course: RawCourse, results: Course[]) {
        const title = course[4].toLowerCase();
        const titleIdx = title.indexOf(query);
        if (titleIdx !== -1) {
            results.push(
                new Course(course, key, [], {
                    match: 'title',
                    start: titleIdx,
                    end: titleIdx + query.length
                })
            );
        }
    }

    private searchTopic(key: string, query: string, course: RawCourse, results: Course[]) {
        // check any topic/professor match. Select the sections which only match the topic/professor
        const topicMatchIdx = [];
        const topicMatches: Match<'topic'>[] = [];
        const sections = course[6];
        for (let i = 0; i < sections.length; i++) {
            const topic = sections[i][2];
            const topicIdx = topic.toLowerCase().indexOf(query);
            if (topicIdx !== -1) {
                topicMatchIdx.push(i);
                topicMatches.push({
                    match: 'topic',
                    start: topicIdx,
                    end: topicIdx + query.length
                });
            }
        }
        if (topicMatchIdx.length)
            results.push(new Course(course, key, topicMatchIdx, undefined, topicMatches));
    }

    private searchProf(key: string, query: string, course: RawCourse, results: Course[]) {
        // check any topic/professor match. Select the sections which only match the topic/professor
        const profMatchIdx = [];
        const profMatches: Match<'instructors'>[] = [];
        const sections = course[6];
        for (let i = 0; i < sections.length; i++) {
            const profs = Meeting.getInstructors(sections[i][7])
                .join(', ')
                .toLowerCase();
            const profIdx = profs.indexOf(query);
            if (profIdx !== -1) {
                profMatchIdx.push(i);
                profMatches.push({
                    match: 'instructors',
                    start: profIdx,
                    end: profIdx + query.length
                });
            }
        }
        if (profMatchIdx.length)
            results.push(new Course(course, key, profMatchIdx, undefined, profMatches));
    }

    private searchDesc(key: string, query: string, course: RawCourse, results: Course[]) {
        const desc = course[5].toLowerCase();
        const descIdx = desc.indexOf(query);
        // lastly, check description match
        if (descIdx !== -1) {
            results.push(
                new Course(course, key, [], {
                    match: 'description',
                    start: descIdx,
                    end: descIdx + query.length
                })
            );
        }
    }
}
