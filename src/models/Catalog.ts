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
import { RawAlgoCourse } from '@/algorithm';
import Course, { CourseMatch } from './Course';
import Schedule from './Schedule';
import { SectionMatch } from './Section';
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

interface SearchWorker extends Worker {
    onmessage(x: MessageEvent): void;
    postMessage(x: string | typeof window.catalog.courseDict): void;
}
/**
 * the match indices for a [[Course]]
 *
 * 0: the array of matches for the fields of this Course
 *
 * 1: the Map that maps [[Section.id]] to the array of matches for the fields of that section
 */
export type SearchMatch = [CourseMatch[], Map<number, SectionMatch[]>];

/**
 * Catalog wraps the raw data of a semester, providing methods to access and search for courses/sections
 */
export default class Catalog {
    public worker?: SearchWorker;
    public readonly courses: Course[];
    /**
     * @param semester the semester corresponding to the catalog stored in this object
     * @param courseDict mapping from course key to course itself
     * borrowing python's snake_case (not changed due to backward compatibility issues)
     * @param modified
     */
    constructor(
        public readonly semester: SemesterJSON,
        public readonly courseDict: { [x: string]: Course },
        public readonly modified: string
    ) {
        this.courses = Object.values(courseDict);
    }

    /**
     * initialize the web worker for searching
     */
    public initWorker(): Promise<'ready'> {
        if (!this.worker) {
            const Worker = require('worker-loader!../workers/SearchWorker');
            const worker: SearchWorker = new Worker();
            const prom: Promise<'ready'> = new Promise(resolve => {
                worker.onmessage = ({ data }) => {
                    resolve(data);
                };
            });
            worker.postMessage(this.courseDict);
            this.worker = worker;
            return prom;
        }
        return Promise.resolve('ready');
    }

    /**
     * terminate the worker and free memory
     */
    public disposeWorker() {
        if (this.worker) {
            this.worker.terminate();
            delete this.worker;
        }
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
        else return course.getCourse([...sections]);
    }

    /**
     * Get a Course associated with the given key and section id
     */
    public getSectionById(key: string, id: number) {
        return this.courseDict[key].getSectionById(id);
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

    /**
     * perform fuzzy search in the dedicated web worker
     */
    public fuzzySearch(query: string) {
        const worker = this.worker;
        if (!worker) return Promise.reject('Worker not initialized!');
        const promise = new Promise((resolve, reject) => {
            worker.onmessage = ({
                data: [args, matches]
            }: {
                data: [RawAlgoCourse[], SearchMatch[]];
            }) => resolve([args.map(x => this.getCourse(x[0], new Set(x[1]))), matches]);
            worker.onerror = err => reject(err);
        });
        worker.postMessage(query);
        return promise as Promise<[Course[], SearchMatch[]]>;
    }

    /**
     * Perform a linear search in the catalog against
     * course number, title, topic, professor name and description, in the order specified.
     * @param query
     * @param max_results
     */
    public search(query: string, max_results = 6): [Course[], SearchMatch[]] {
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

        const results: Course[] = [];
        const matches: SearchMatch[] = [];
        const courses = this.courses;
        const len = courses.length;

        if (!spec || field === 'num' || field === 'key')
            for (let i = 0; i < len; i++) {
                this.searchKey(queryNoSp, courses[i], results, matches);
                if (results.length >= max_results) return [results, matches];
            }

        if (!spec || field === 'title')
            for (let i = 0; i < len; i++) {
                this.searchField(query, 'title', courses[i], results, matches);
                if (results.length >= max_results) return [results, matches];
            }

        if (!spec || field === 'topic')
            for (let i = 0; i < len; i++) {
                this.searchTopic(query, courses[i], results, matches);
                if (results.length >= max_results) return [results, matches];
            }

        if (!spec || field === 'prof')
            for (let i = 0; i < len; i++) {
                this.searchProf(query, courses[i], results, matches);
                if (results.length >= max_results) return [results, matches];
            }

        if (!spec || field === 'desc')
            for (let i = 0; i < len; i++) {
                this.searchField(query, 'description', courses[i], results, matches);
                if (results.length >= max_results) return [results, matches];
            }
        return [results, matches];
    }

    private searchKey(
        queryNoSp: string,
        course: Course,
        results: Course[],
        matches: SearchMatch[]
    ) {
        const key = course.key;
        const keyIdx = key.indexOf(queryNoSp);
        // match with the course number
        if (keyIdx !== -1) {
            const deptLen = course.department.length;
            const end = keyIdx + queryNoSp.length;
            results.push(course);
            matches.push([
                [
                    {
                        match: 'key',
                        start: keyIdx + +(keyIdx >= deptLen),
                        end: end + +(end > deptLen)
                    }
                ],
                new Map()
            ]);
        }
    }

    private searchField(
        query: string,
        field: 'title' | 'description',
        course: Course,
        results: Course[],
        matches: SearchMatch[]
    ) {
        const target = course[field].toLowerCase();
        const key = course.key;
        const targetIdx = target.indexOf(query);
        if (targetIdx !== -1) {
            const prev = results.findIndex(x => x.key === key);
            const match: CourseMatch = {
                match: field,
                start: targetIdx,
                end: targetIdx + query.length
            };
            if (prev !== -1) {
                matches[prev][0].push(match);
            } else {
                results.push(course);
                matches.push([[match], new Map()]);
            }
        }
    }

    private searchTopic(query: string, course: Course, results: Course[], matches: SearchMatch[]) {
        // check any topic/professor match. Select the sections which only match the topic/professor
        const topicMatches = new Map<number, [SectionMatch]>();
        for (const sec of course.sections) {
            const topic = sec.topic;
            const topicIdx = topic.toLowerCase().indexOf(query);
            if (topicIdx !== -1) {
                topicMatches.set(sec.id, [
                    {
                        match: 'topic',
                        start: topicIdx,
                        end: topicIdx + query.length
                    }
                ]);
            }
        }
        if (topicMatches.size) this.appendToResult(course, topicMatches, results, matches);
    }

    private searchProf(query: string, course: Course, results: Course[], matches: SearchMatch[]) {
        // check any topic/professor match. Select the sections which only match the topic/professor
        const profMatches = new Map<number, [SectionMatch]>();
        for (const sec of course.sections) {
            const profs = sec.instructors.join(', ').toLowerCase();
            const profIdx = profs.indexOf(query);
            if (profIdx !== -1) {
                profMatches.set(sec.id, [
                    {
                        match: 'instructors',
                        start: profIdx,
                        end: profIdx + query.length
                    }
                ]);
            }
        }
        if (profMatches.size) this.appendToResult(course, profMatches, results, matches);
    }

    private appendToResult(
        course: Course,
        matches: Map<number, SectionMatch[]>,
        results: Course[],
        allMatches: SearchMatch[]
    ) {
        const prev = results.findIndex(x => x.key === course.key);
        if (prev !== -1) {
            results[prev] = course.getCourse([
                ...new Set(course.ids.concat([...matches.keys()])) // merge sids and eliminate duplicates
            ]);
            // merge the section matches with the previously recorded section matches
            const combSecMatches = allMatches[prev][1];
            for (const [id, mats] of matches) {
                const prevMats = combSecMatches.get(id);
                if (prevMats) prevMats.push(...mats);
                else combSecMatches.set(id, mats);
            }
        } else {
            results.push(course.getCourse([...matches.keys()]));
            allMatches.push([[], matches]);
        }
    }
}
