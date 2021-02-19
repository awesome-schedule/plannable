// note: this is the description for the entire module.
/**
 * models and data structures used across the website
 * @module src/models
 * @preferred
 */

/**
 *
 */
import Course, { Match } from './Course';
import Schedule from './Schedule';
import Section, { SectionMatch } from './Section';
import { FastSearcherNative, SearchResult } from '@/algorithm/Searcher';
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
 * the match entry for a [[Course]]
 *
 * 0: the array of matches for the fields of this Course
 *
 * 1: the Map that maps [[Section.id]] to the array of matches for the fields of that section
 */
export type SearchMatch = [Match<'key' | 'title' | 'description'>[], Map<number, SectionMatch[]>];

/**
 * elements in array:
 * 1. score for courses,
 * 2. score for sections,
 * 3. number of distinct sections
 */
type ScoreEntry = [number, number, number];
type CourseSearchResult = SearchResult<Course, 'title' | 'description'>;
type SectionSearchResult = SearchResult<Section, 'topic' | 'instructors'>;

const courseMap = new Map<string, CourseSearchResult[]>();
const sectionMap = new Map<string, Map<number, SectionSearchResult[]>>();
const scores = new Map<string, ScoreEntry>();

function toMatches<T extends string>(matches: SearchResult<any, T>[]) {
    const allMatches: Match<T>[] = [];
    for (const { data, matches: m } of matches) {
        for (let i = 0; i < m.length; i += 2) {
            allMatches.push({
                match: data,
                start: m[i],
                end: m[i + 1]
            });
        }
    }
    return allMatches;
}

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

    private titleSearcher?: FastSearcherNative<Course, 'title'>;
    private descriptionSearcher?: FastSearcherNative<Course, 'description'>;
    private topicSearcher?: FastSearcherNative<Section, 'topic'>;
    private instrSearcher?: FastSearcherNative<Section, 'instructors'>;
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
    public initWorker() {
        if (!this.titleSearcher) {
            this.titleSearcher = new FastSearcherNative(this.courses, obj => obj.title, 'title');
            this.descriptionSearcher = new FastSearcherNative(
                this.courses,
                obj => obj.description,
                'description'
            );
            this.topicSearcher = new FastSearcherNative(this.sections, obj => obj.topic, 'topic');
            this.instrSearcher = new FastSearcherNative(
                this.sections,
                obj => obj.instructors.join(' '),
                'instructors'
            );
        }
    }

    /**
     * terminate the worker and free memory
     */
    public disposeWorker() {
        //
    }

    /**
     * Get a Course associated with the given key
     *
     * you may specify a set of section indices so that you can
     * only obtain a subset of the original course sections
     */
    public getCourse(key: string, sections?: number[] | Set<number> | -1) {
        const course = this.courseDict[key];
        if (!sections || sections === -1) return course;
        if (sections instanceof Array) return course.getCourse(sections);
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

    private processCourseResults(results: CourseSearchResult[], weight: number) {
        for (const result of results) {
            const { key } = this.courses[result.index];
            const score = result.score ** 2 * weight;

            const temp = courseMap.get(key);
            if (temp) {
                scores.get(key)![0] += score;
                temp.push(result);
            } else {
                // if encounter this course for the first time
                scores.set(key, [score, 0, 0]);
                courseMap.set(key, [result]);
            }
        }
    }

    private processSectionResults(results: SectionSearchResult[], weight: number) {
        for (const result of results) {
            const { key, id } = this.sections[result.index];
            const score = result.score ** 2 * weight;

            let scoreEntry = scores.get(key);
            if (!scoreEntry) {
                scoreEntry = [0, 0, 0];
                scores.set(key, scoreEntry);
            }
            scoreEntry[1] += score;

            const secMatches = sectionMap.get(key);
            if (secMatches) {
                const matches = secMatches.get(id);
                if (matches) {
                    matches.push(result);
                } else {
                    secMatches.set(id, [result]);
                    // if encounter a new section of a course, increment the number of section recorded
                    scoreEntry[2] += 1;
                }
            } else {
                sectionMap.set(key, new Map().set(id, [result]));
                scoreEntry[2] += 1;
            }
        }
    }

    /**
     * perform fuzzy search in the dedicated web worker
     */
    public fuzzySearch(query: string) {
        console.time('search');
        this.processCourseResults(this.titleSearcher!.sWSearch(query, 50), 1);
        this.processCourseResults(this.descriptionSearcher!.sWSearch(query, 50), 0.5);
        this.processSectionResults(this.topicSearcher!.sWSearch(query, 50), 0.9);
        this.processSectionResults(this.instrSearcher!.sWSearch(query, 50), 0.25);
        console.timeEnd('search');

        // sort courses in descending order; section score is normalized before added to course score
        const scoreEntries = Array.from(scores)
            .map(([_, a]) => [_, a[0] + (a[2] && a[1] / a[2])] as const)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 12)
            .filter(entry => entry[1] > 0.1);
        console.log(scoreEntries);

        const finalResults: Course[] = [];
        const allMatches: SearchMatch[] = [];

        // merge course and section matches
        for (const [key] of scoreEntries) {
            const courseMatch = courseMap.get(key);
            const secMatches = new Map<number, SectionMatch[]>();

            // record section matches
            const s = sectionMap.get(key);
            if (s) for (const [id, matches] of s) secMatches.set(id, toMatches(matches));

            if (courseMatch) {
                const crsMatches = toMatches(courseMatch);
                finalResults.push(this.getCourse(key, courseMatch[0].item.ids));
                allMatches.push([crsMatches, secMatches]);
            } else {
                // only section match exists
                finalResults.push(this.getCourse(key, [...secMatches.keys()]));
                allMatches.push([[], secMatches]);
            }
        }
        // console.log(finalResults, allMatches);

        courseMap.clear();
        sectionMap.clear();
        scores.clear();
        return [finalResults, allMatches] as const;
    }

    /**
     * Perform a linear search in the catalog against
     * course number, title, topic, professor name and description, in the order specified.
     * @param query
     * @param maxResults
     */
    public search(query: string, maxResults = 6): [Course[], SearchMatch[]] {
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
            const match = {
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
