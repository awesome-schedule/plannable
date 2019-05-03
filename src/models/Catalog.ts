/**
 * @author Hanzhi Zhou
 * @see [[Catalog]]
 */

/**
 *
 */
import Course from './Course';
import Meta, { RawCatalog } from './Meta';
import Expirable from '../data/Expirable';
import Schedule from './Schedule';

/**
 * represents a semester
 */
export interface Semester {
    /**
     * semester id, e.g. `1198`
     */
    id: string;
    /**
     * semester name, e.g. Fall 2019
     */
    name: string;
}

export interface CatalogJSON extends Expirable {
    semester: Semester;
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
        return new Catalog(data.semester, data.raw_data);
    }
    /**
     * the semester corresponding to the catalog stored in this object
     */
    public semester: Semester;
    /**
     * the raw representation of the course catalog
     */
    public raw_data: RawCatalog;

    constructor(semester: Semester, raw_data: RawCatalog) {
        this.semester = semester;
        this.raw_data = raw_data;
    }

    public fromJSON(data: CatalogJSON) {
        return Catalog.fromJSON(data);
    }

    public toJSON(): CatalogJSON {
        return {
            semester: this.semester,
            raw_data: this.raw_data,
            modified: new Date().toJSON()
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
     */
    convertKey(schedule: Schedule, key: string) {
        const raw = this.raw_data[key];
        if (raw) return `${raw[0]} ${raw[1]} ${Meta.TYPES[raw[2]]}`;
        else {
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
        const query_no_sp = query.split(' ').join('');
        const matches: Course[][] = [[], [], [], [], []];

        for (const key in this.raw_data) {
            const course = this.raw_data[key];

            // match with the course number
            if (key.indexOf(query_no_sp) !== -1) {
                matches[0].push(new Course(course, key));

                // match with the title
            } else if (course[4].toLowerCase().indexOf(query) !== -1) {
                matches[1].push(new Course(course, key));
            } else {
                // check any topic/professor match. Select the sections which only match the topic/professor
                const topicMatchIdx = [];
                const profMatchIdx = [];

                for (let i = 0; i < course[6].length; i++) {
                    const section = course[6][i];
                    const topic = section[2];
                    if (topic.toLowerCase().indexOf(query) !== -1) {
                        topicMatchIdx.push(i);
                        continue;
                    }
                    const meetings = section[7];
                    for (const meeting of meetings) {
                        // TODO: better prof name match
                        if (meeting[0].toLowerCase().indexOf(query) !== -1) {
                            profMatchIdx.push(i);
                            break;
                        }
                    }
                }
                if (topicMatchIdx.length > 0) {
                    matches[2].push(new Course(course, key, topicMatchIdx));
                } else if (profMatchIdx.length > 0) {
                    matches[4].push(new Course(course, key, profMatchIdx));
                    // lastly, check description match
                } else if (course[5].toLowerCase().indexOf(query) !== -1) {
                    matches[3].push(new Course(course, key));
                }
            }
            if (matches[0].length >= max_results) break;
        }
        const results: Course[] = [];
        for (let i = 0, count = 0; i < 5; i++) {
            const match = matches[i];
            for (let j = 0; j < match.length; j++) {
                results.push(match[j]);
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
