// note: this is the description for the entire module.
/**
 * models and data structures used across the website
 * @module src/models
 * @preferred
 */

/**
 *
 */
import { RawAlgoCourse } from '../algorithm/ScheduleGenerator';
import Course, { CourseMatch } from './Course';
import Schedule from './Schedule';
import Section, { SectionMatch } from './Section';
import Worker from 'worker-loader!../workers/SearchWorker';
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

/**
 * the match indices for a [[Course]]
 *
 * 0: the array of matches for the fields of this Course
 *
 * 1: the Map that maps [[Section.id]] to the array of matches for the fields of that section
 */
export type SearchMatch = [CourseMatch[], Map<number, SectionMatch[]>];
type SearchResult = readonly [Course[], SearchMatch[]];

type SearchWorkerResult = [RawAlgoCourse[], SearchMatch[]];

/**
 * Catalog wraps the raw data of a semester, providing methods to access and search for courses/sections
 * @author Hanzhi Zhou
 */
export default class Catalog {
    public worker?: Worker;
    /**
     * a mapping from course key to course itself
     */
    public readonly courseDict: { readonly [courseKey: string]: Course };
    /**
     * array of all courses. equal to `Object.values(this.courseDict)`
     */
    public readonly courses: readonly Course[];
    /**
     * array of all sections. equal to
     * ```js
     * this.courses.flatMap(c => c.sections)
     * ```
     */
    public readonly sections: readonly Section[];
    /**
     * a map from section id to section instance
     */
    private readonly sectionMap: Map<number, Section>;
    /**
     * the pending search (one that's not completed yet)
     */
    private readonly resultMap = new Map<string, SearchResult>();
    private readonly promMap = new Map<string, (value: any) => void>();
    /**
     * @param semester the semester corresponding to the catalog stored in this object
     * @param data
     * @param modified
     */
    constructor(
        public readonly semester: SemesterJSON,
        data: ReturnType<Catalog['data']>,
        public readonly modified: number
    ) {
        [this.courseDict, this.courses, this.sections] = data;
        this.sectionMap = new Map();
        for (const sec of this.sections) {
            this.sectionMap.set(sec.id, sec);
        }
    }

    /**
     * only for type reflection and testing
     */
    private data() {
        return [this.courseDict, this.courses, this.sections] as const;
    }

    /**
     * initialize the web worker for searching
     */
    public async initWorker(): Promise<'ready'> {
        if (!this.worker) {
            // use require because we don't want this in unit-tests
            // this if branch will not tested in unit-tests because there's no web worker
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const worker = new Worker();
            worker.onerror = err => console.error(err);
            worker.postMessage([this.courses, this.sections]);
            await new Promise<'ready'>(resolve => {
                worker.onmessage = ({ data }) => {
                    resolve(data);
                };
            });
            worker.onmessage = ({ data: [query, result] }) => {
                this.resultMap.set(query, this.convertWorkerResult(result));
                const resolve = this.promMap.get(query);
                if (resolve) {
                    resolve(this.convertWorkerResult(result));
                    this.promMap.delete(query);
                }
            };
            this.worker = worker;
        }
        return 'ready';
    }

    /**
     * terminate the worker and free memory
     */
    public disposeWorker() {
        if (this.worker) {
            this.worker.terminate();
            this.resultMap.clear();
            this.worker = undefined;
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
    public getSectionById(id: number) {
        const sec = this.sectionMap.get(id);
        if (!sec) throw new Error('Non-existent id ' + id);
        return sec;
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

        const lastResult = this.resultMap.get(query);
        if (lastResult && !(lastResult instanceof ErrorEvent)) {
            return Promise.resolve(lastResult);
        }
        const promise = new Promise<SearchResult>((resolve, reject) => {
            this.promMap.set(query, resolve);
        });
        worker.postMessage(query);

        return promise;
    }

    private convertWorkerResult([courses, match]: SearchWorkerResult) {
        return [courses.map(x => this.getCourse(x[0], new Set(x[1]))), match] as const;
    }

    /**
     * Perform a linear search in the catalog against
     * course number, title, topic, professor name and description, in the order specified.
     * @param query
     * @param maxResults
     */
    public search(query: string, maxResults = 6): SearchResult {
        query = query.trim().toLowerCase();
        const temp = query.split(/\s+/);
        query = temp.join(' ');

        /** is special search*/
        const spec = query.startsWith(':') && temp.length > 1;

        /** query no space*/
        let queryNoSp: string;
        let field = '';
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
                if (results.length >= maxResults) return [results, matches];
            }

        if (!spec || field === 'title')
            for (let i = 0; i < len; i++) {
                this.searchField(query, 'title', courses[i], results, matches);
                if (results.length >= maxResults) return [results, matches];
            }

        if (!spec || field === 'topic')
            for (let i = 0; i < len; i++) {
                this.searchTopic(query, courses[i], results, matches);
                if (results.length >= maxResults) return [results, matches];
            }

        if (!spec || field === 'prof')
            for (let i = 0; i < len; i++) {
                this.searchProf(query, courses[i], results, matches);
                if (results.length >= maxResults) return [results, matches];
            }

        if (!spec || field === 'desc')
            for (let i = 0; i < len; i++) {
                this.searchField(query, 'description', courses[i], results, matches);
                if (results.length >= maxResults) return [results, matches];
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
