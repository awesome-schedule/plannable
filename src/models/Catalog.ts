/**
 * @author Hanzhi Zhou
 * @see [[Catalog]]
 */

/**
 *
 */
import Course, { Match } from './Course';
import Meta, { RawCatalog } from './Meta';
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
     * @returns `null` if data is invalid
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
     */
    public raw_data: RawCatalog;
    public modified: string;

    constructor(semester: SemesterJSON, raw_data: RawCatalog, modified: string) {
        this.semester = semester;
        this.raw_data = raw_data;
        this.modified = modified;
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
        console.time('query');
        query = query.trim().toLowerCase();
        // query no space
        const queryLength = query.length;
        const query_no_sp = query.split(' ').join('');
        const matches: Course[][] = [[], [], [], [], []];

        for (const key in this.raw_data) {
            const course = this.raw_data[key];

            const keyIdx = key.indexOf(query_no_sp);
            // match with the course number
            if (keyIdx !== -1) {
                const deptLen = course[0].length;
                const end = keyIdx + query_no_sp.length;
                matches[0].push(
                    new Course(course, key, [], {
                        match: 'key',
                        start: keyIdx + +(keyIdx >= deptLen),
                        end: end + +(end > deptLen)
                    })
                );
                continue;

                // match with the title
            }
            if (matches[0].length >= max_results) break;

            const title = course[4].toLowerCase();
            const titleIdx = title.indexOf(query);
            if (titleIdx !== -1) {
                matches[1].push(
                    new Course(course, key, [], {
                        match: 'title',
                        start: titleIdx,
                        end: titleIdx + queryLength
                    })
                );
                continue;
            }

            // check any topic/professor match. Select the sections which only match the topic/professor
            const topicMatchIdx = [];
            const topicMatches: Match<'topic'>[] = [];
            const profMatchIdx = [];
            const profMatches: Match<'instructors'>[] = [];

            for (let i = 0; i < course[6].length; i++) {
                const section = course[6][i];
                const topic = section[2];
                const topicIdx = topic.toLowerCase().indexOf(query);
                if (topicIdx !== -1) {
                    topicMatchIdx.push(i);
                    topicMatches.push({
                        match: 'topic',
                        start: topicIdx,
                        end: topicIdx + queryLength
                    });
                    continue;
                }
                const profs = Meeting.getInstructors(section[7])
                    .join(', ')
                    .toLowerCase();
                const profIdx = profs.indexOf(query);
                if (profIdx !== -1) {
                    profMatchIdx.push(i);
                    profMatches.push({
                        match: 'instructors',
                        start: profIdx,
                        end: profIdx + queryLength
                    });
                }
            }
            if (topicMatchIdx.length > 0) {
                matches[2].push(new Course(course, key, topicMatchIdx, undefined, topicMatches));
                continue;
            }
            if (profMatchIdx.length > 0) {
                matches[4].push(new Course(course, key, profMatchIdx, undefined, profMatches));
                continue;
            }
            const desc = course[5].toLowerCase();
            const descIdx = desc.indexOf(query);
            // lastly, check description match
            if (descIdx !== -1) {
                matches[3].push(
                    new Course(course, key, [], {
                        match: 'description',
                        start: descIdx,
                        end: descIdx + queryLength
                    })
                );
            }
        }
        const results: Course[] = [];
        for (let i = 0, count = 0; i < 5; i++) {
            const match = matches[i];
            for (const m of match) {
                results.push(m);
                count++;
                if (count >= max_results) {
                    console.timeEnd('query');
                    return results;
                }
            }
        }
        console.timeEnd('query');
        return results;
    }
}
