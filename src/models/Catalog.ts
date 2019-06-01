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
import { Searcher, SearchResult } from 'fast-fuzzy';
import Section from './Section';

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
    private courseSearcher: Searcher<Course>;
    private sectionSearcher: Searcher<Section>;

    constructor(semester: SemesterJSON, raw_data: RawCatalog, modified: string) {
        this.semester = semester;
        this.raw_data = raw_data;
        this.modified = modified;

        // this.raw_data.cs45015[6].push([
        //     19281,
        //     '001',
        //     'zxczxc',
        //     2,
        //     93,
        //     91,
        //     52,
        //     [
        //         [
        //             'Comp. Vision',
        //             'MoWe 5:00PM - 6:15PM',
        //             'Thornton Hall E316',
        //             '08/27/2019 - 12/06/2019'
        //         ]
        //     ]
        // ]);

        console.time('catalog prep data');
        const keys = Object.keys(this.raw_data);
        const values = Object.values(this.raw_data);
        const len = keys.length;
        const courses: Course[] = [];
        const sections: Section[] = [];
        for (let i = 0; i < len; i++) {
            const key = keys[i];
            const c = new Course(values[i], key);
            courses.push((this.courseDict[key] = c));
            sections.push(...c.sections);
        }
        this.keys = keys;
        this.values = values;

        this.sectionSearcher = new Searcher(sections, {
            returnMatchData: true,
            ignoreCase: true,
            normalizeWhitespace: true,
            keySelector: obj => [obj.topic, obj.instructors.join(', ')]
        });
        this.courseSearcher = new Searcher(courses, {
            returnMatchData: true,
            ignoreCase: true,
            normalizeWhitespace: true,
            keySelector: obj => [obj.title, obj.description]
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
    public getSection(key: string, idx = 0) {
        const course = this.courseDict[key];
        if (course) return course.sections[idx];
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

    public fuzzySearch2(query: string) {
        const courseResults = this.courseSearcher.search(query);
        const courseScores: { [x: string]: number } = Object.create(null);
        const courseMap: { [x: string]: SearchResult<Course> } = Object.create(null);
        for (const result of courseResults) {
            const key = result.item.key;
            courseScores[key] = result.score;
            courseMap[key] = result;
        }
        const sectionResults = this.sectionSearcher.search(query);
        const sectionMap: { [x: string]: SearchResult<Section>[] } = Object.create(null);

        for (const result of sectionResults) {
            const key = result.item.key;
            if (courseScores[key]) {
                courseScores[key] += result.score;
            } else {
                courseScores[key] = result.score;
            }
            if (sectionMap[key]) {
                sectionMap[key].push(result);
            } else {
                sectionMap[key] = [result];
            }
        }

        const scoreEntries = Object.entries(courseScores)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);

        const finalResults: Course[] = [];
        for (const [key] of scoreEntries) {
            const courseMatch = courseMap[key];
            let course: Course;
            if (courseMatch) {
                course = courseMatch.item;
                const { match, original } = courseMatch;
                course.matches.push({
                    match: original === course.title ? 'title' : 'description',
                    start: match.index,
                    end: match.index + match.length
                });
                const s = sectionMap[key];
                if (s) {
                    course.addSectionMatches(
                        s.map(x => x.item.sid),
                        s.map(x => [
                            {
                                match: x.original === x.item.topic ? 'topic' : 'instructors',
                                start: x.match.index,
                                end: x.match.index + x.match.length
                            }
                        ])
                    );
                }
            } else {
                const s = sectionMap[key];
                course = new Course(
                    s[0].item.course.raw,
                    key,
                    s.map(x => x.item.sid),
                    [],
                    s.map(x => [
                        {
                            match: x.original === x.item.topic ? 'topic' : 'instructors',
                            start: x.match.index,
                            end: x.match.index + x.match.length
                        }
                    ])
                );
            }
            finalResults.push(course);
        }
        return finalResults;
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
        if (titleIdx !== -1) {
            const prev = results.find(x => x.key === key);
            const match: Match<'title'> = {
                match: 'title',
                start: titleIdx,
                end: titleIdx + query.length
            };
            if (prev) {
                prev.matches.push(match);
            } else {
                results.push(new Course(course, key, [], [match]));
            }
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
        if (topicMatchIdx.length) {
            const prev = results.find(x => x.key === key);
            if (prev) {
                prev.addSectionMatches(topicMatchIdx, topicMatches);
            } else {
                results.push(new Course(course, key, topicMatchIdx, [], topicMatches));
            }
        }
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
        if (profMatchIdx.length) {
            const prev = results.find(x => x.key === key);
            if (prev) {
                prev.addSectionMatches(profMatchIdx, profMatches);
            } else {
                results.push(new Course(course, key, profMatchIdx, [], profMatches));
            }
        }
    }

    private searchDesc(key: string, query: string, course: RawCourse, results: Course[]) {
        const desc = course[5].toLowerCase();
        const descIdx = desc.indexOf(query);
        // lastly, check description match
        if (descIdx !== -1) {
            const prev = results.find(x => x.key === key);
            const match: Match<'description'> = {
                match: 'description',
                start: descIdx,
                end: descIdx + query.length
            };
            if (prev) {
                prev.matches.push(match);
            } else {
                results.push(new Course(course, key, [], [match]));
            }
        }
    }
}
