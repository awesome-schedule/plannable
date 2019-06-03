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
import Course, { Match, CourseMatch, CourseConstructorArguments } from './Course';
import { RawCatalog } from './Meta';
import Expirable from '../data/Expirable';
import Schedule from './Schedule';
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
    readonly semester: SemesterJSON;
    readonly raw_data: RawCatalog;
}

interface SearchWorkerOnMessage extends MessageEvent {
    data: 'ready' | CourseConstructorArguments[];
}

interface SearchWorker extends Worker {
    onmessage(x: SearchWorkerOnMessage): void;
    postMessage(x: string | typeof window.catalog.courseDict): void;
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

    public worker?: SearchWorker;
    public readonly courses: Course[];
    public readonly courseDict: { [x: string]: Course } = {};

    /**
     * @param semester the semester corresponding to the catalog stored in this object
     * @param raw_data the raw representation of the course catalog,
     * borrowing python's snake_case (not changed due to backward compatibility issues)
     * @param modified
     */
    constructor(
        public readonly semester: SemesterJSON,
        public readonly raw_data: RawCatalog,
        public readonly modified: string
    ) {
        console.time('catalog prep data');
        const courses: Course[] = [];
        for (const key in raw_data)
            courses.push((this.courseDict[key] = new Course(raw_data[key], key)));

        this.courses = courses;
        console.timeEnd('catalog prep data');
    }

    /**
     * initialize the web worker for searching
     */
    public initWorker(): Promise<'ready'> {
        if (!this.worker) {
            const Worker = require('worker-loader!../workers/SearchWorker');
            const worker: SearchWorker = new Worker();
            const prom = new Promise(resolve => {
                worker.onmessage = msg => {
                    resolve(msg.data as 'ready');
                };
            }) as Promise<'ready'>;
            worker.postMessage(this.courseDict);
            this.worker = worker;
            return prom;
        }
        return Promise.resolve('ready') as Promise<'ready'>;
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
        const course = this.courseDict[key];
        if (!sections || sections === -1) return course;
        else return course.getCourse([...sections.values()]);
    }

    /**
     * Get a Course associated with the given key and section index
     */
    public getSection(key: string, idx = 0) {
        return this.courseDict[key].sections[idx];
    }

    /**
     * convert `cs11105` style key to `CS 1110 Lecture`
     *
     * convert key of an event (e.g. `MoFr 1:00PM - 2:00PM`) to its title
     */
    convertKey(key: string, schedule?: Schedule) {
        const course = this.courseDict[key];
        if (course) return course.displayName;
        else if (schedule) {
            const event = schedule.events.find(e => e.key === key);
            if (event) return event.title === '' ? key : event.title;
            else return key;
        }
    }

    public fuzzySearch(query: string) {
        const worker = this.worker;
        if (!worker) return Promise.reject('Worker not initialized!');
        const promise = new Promise(resolve => {
            worker.onmessage = ({ data }) => {
                resolve((data as CourseConstructorArguments[]).map(x => new Course(...x)));
            };
        });
        worker.postMessage(query);
        return promise as Promise<Course[]>;
    }

    /**
     * Perform a linear search in the catalog against
     * course number, title, topic, professor name and description, in the order specified.
     * @param query
     * @param max_results
     */
    public search(query: string, max_results = 6) {
        query = query
            .trim()
            .toLowerCase()
            .split(/ +/) // remove redundant spaces
            .join(' ');
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
        const courses = this.courses;
        const len = courses.length;

        if (!spec || field === 'num' || field === 'key')
            for (let i = 0; i < len; i++) {
                this.searchKey(queryNoSp, courses[i], matches);
                if (matches.length >= max_results) return matches;
            }

        if (!spec || field === 'title')
            for (let i = 0; i < len; i++) {
                this.searchField(query, 'title', courses[i], matches);
                if (matches.length >= max_results) return matches;
            }

        if (!spec || field === 'topic')
            for (let i = 0; i < len; i++) {
                this.searchTopic(query, courses[i], matches);
                if (matches.length >= max_results) return matches;
            }

        if (!spec || field === 'prof')
            for (let i = 0; i < len; i++) {
                this.searchProf(query, courses[i], matches);
                if (matches.length >= max_results) return matches;
            }

        if (!spec || field === 'desc')
            for (let i = 0; i < len; i++) {
                this.searchField(query, 'description', courses[i], matches);
                if (matches.length >= max_results) return matches;
            }
        return matches;
    }

    private searchKey(queryNoSp: string, course: Course, results: Course[]) {
        const key = course.key;
        const keyIdx = key.indexOf(queryNoSp);
        // match with the course number
        if (keyIdx !== -1) {
            const deptLen = course.department.length;
            const end = keyIdx + queryNoSp.length;
            results.push(
                new Course(
                    course.raw,
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

    private searchField(
        query: string,
        field: 'title' | 'description',
        course: Course,
        results: Course[]
    ) {
        const target = course[field].toLowerCase();
        const key = course.key;
        const targetIdx = target.indexOf(query);
        if (targetIdx !== -1) {
            const prev = results.find(x => x.key === key);
            const match: CourseMatch = {
                match: field,
                start: targetIdx,
                end: targetIdx + query.length
            };
            if (prev) {
                prev.matches.push(match);
            } else {
                results.push(new Course(course.raw, key, [], [match]));
            }
        }
    }

    private searchTopic(query: string, course: Course, results: Course[]) {
        // check any topic/professor match. Select the sections which only match the topic/professor
        const topicMatchIdx = [];
        const topicMatches: [Match<'topic'>][] = [];
        const sections = course.sections;
        for (let i = 0; i < sections.length; i++) {
            const topic = sections[i].topic;
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
            const prev = results.find(x => x.key === course.key);
            if (prev) {
                prev.addSectionMatches(topicMatchIdx, topicMatches);
            } else {
                results.push(new Course(course.raw, course.key, topicMatchIdx, [], topicMatches));
            }
        }
    }

    private searchProf(query: string, course: Course, results: Course[]) {
        // check any topic/professor match. Select the sections which only match the topic/professor
        const profMatchIdx = [];
        const profMatches: [Match<'instructors'>][] = [];
        const sections = course.sections;
        for (let i = 0; i < sections.length; i++) {
            const profs = sections[i].instructors.join(', ').toLowerCase();
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
            const prev = results.find(x => x.key === course.key);
            if (prev) {
                prev.addSectionMatches(profMatchIdx, profMatches);
            } else {
                results.push(new Course(course.raw, course.key, profMatchIdx, [], profMatches));
            }
        }
    }
}
