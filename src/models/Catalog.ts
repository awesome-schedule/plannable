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
import { FastSearcher, SearchResult } from '@/algorithm/Searcher';
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

type CourseSearchResult = SearchResult<Course, 'title' | 'description'>;
type SectionSearchResult = SearchResult<Section, 'topic' | 'instructors' | 'rooms'>;

interface ScoreEntry {
    courseScore: number;
    courseResults: CourseSearchResult[];
    sectionScore: number;
    sectionMap: Map<number, SectionSearchResult[]>;
};

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

    private titleSearcher: FastSearcher<Course, 'title'>;
    private descriptionSearcher: FastSearcher<Course, 'description'>;
    private topicSearcher: FastSearcher<Section, 'topic'>;
    private instrSearcher: FastSearcher<Section, 'instructors'>;
    private roomSearcher: FastSearcher<Section, 'rooms'>;
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
        console.time('catalog prep');
        [this.courseDict, this.courses, this.sections] = data;
        this.sectionMap = new Map();
        for (const sec of this.sections) {
            this.sectionMap.set(sec.id, sec);
        }
        this.titleSearcher = new FastSearcher(this.courses, obj => obj.title, 'title');
        this.descriptionSearcher = new FastSearcher(
            this.courses,
            obj => obj.description,
            'description'
        );
        this.topicSearcher = new FastSearcher(this.sections, obj => obj.topic, 'topic');
        this.instrSearcher = new FastSearcher(
            this.sections,
            obj => obj.instructors,
            'instructors'
        );
        this.roomSearcher = new FastSearcher(
            this.sections,
            obj => obj.rooms,
            'rooms'
        );
        console.timeEnd('catalog prep');
    }

    /**
     * only for type reflection and testing
     */
    private data() {
        return [this.courseDict, this.courses, this.sections] as const;
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
     * Get a section given its section id
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
            const score = result.score * weight;

            const temp = scores.get(key);
            if (temp) {
                temp.courseScore += score;
                temp.courseResults.push(result);
            } else {
                // if encounter this course for the first time
                scores.set(key, {
                    courseScore: score,
                    courseResults: [result],
                    sectionScore: 0.0,
                    sectionMap: new Map()
                });
            }
        }
    }

    private processSectionResults(results: SectionSearchResult[], weight: number) {
        for (const result of results) {
            const { key, id } = this.sections[result.index];
            const score = result.score * weight;

            const scoreEntry = scores.get(key);
            if (!scoreEntry) {
                scores.set(key, {
                    courseScore: 0.0,
                    courseResults: [],
                    sectionScore: score,
                    sectionMap: new Map().set(id, [result])
                });
            } else {
                scoreEntry.sectionScore += score;
                const secResults = scoreEntry.sectionMap.get(id);
                if (secResults) {
                    secResults.push(result);
                } else {
                    scoreEntry.sectionMap.set(id, [result]);
                }
            }
        }
    }

    private prepQuery(query: string) {
        query = query.trim().toLowerCase();
        const temp = query.split(/\s+/);
        query = temp.join(' ');

        /** query no space*/
        let queryNoSp: string;
        let field = '';
        /** is special search*/
        if (query.startsWith(':')) {
            field = temp[0].substring(1);
            const rest = temp.slice(1);
            queryNoSp = rest.join('');
            query = rest.join(' ');
        } else {
            queryNoSp = temp.join('');
        }

        return [query, field, queryNoSp] as const
    }

    public fuzzySearch(_query: string) {
        console.time('search');
        const [query, field] = this.prepQuery(_query);
        if (!field || field.startsWith('title'))
            this.processCourseResults(this.titleSearcher.sWSearch(query, 100), 1.0);
        if (!field || field.startsWith('desc'))
            this.processCourseResults(this.descriptionSearcher.sWSearch(query, 100), 0.5);
        if (!field || field.startsWith('topic'))
            this.processSectionResults(this.topicSearcher.sWSearch(query, 100), 1.0);
        if (!field || field.startsWith('prof'))
            this.processSectionResults(this.instrSearcher.sWSearch(query, 100), 0.5);
        if (field.startsWith('room'))
            this.processSectionResults(this.roomSearcher.sWSearch(query, 100), 1.0);

        // sort courses in descending order; section score is normalized before added to course score
        const scoreEntries = Array.from(scores)
            .map(([_, a]) => [_, a.courseScore + (a.sectionMap.size && a.sectionScore / a.sectionMap.size)] as const)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 12)
            .filter(entry => entry[1] > 0.001);
        const finalResults: Course[] = [];
        const allMatches: SearchMatch[] = [];

        // merge course and section matches
        for (const [key] of scoreEntries) {
            const temp = scores.get(key)!;
            const secMatches = new Map<number, SectionMatch[]>();

            // convert section matches
            for (const [id, matches] of temp.sectionMap)
                secMatches.set(id, toMatches(matches));

            if (temp.courseResults.length) {
                finalResults.push(this.getCourse(key, -1));
                allMatches.push([toMatches(temp.courseResults), secMatches]);
            } else {
                // only section match exists
                finalResults.push(this.getCourse(key, [...secMatches.keys()]));
                allMatches.push([[], secMatches]);
            }
        }
        // console.log(finalResults, allMatches);

        scores.clear();
        console.timeEnd('search');
        return [finalResults, allMatches] as const;
    }

    /**
     * Perform a linear search in the catalog against
     * course number, title, topic, professor name and description, in the order specified.
     * @param _query
     * @param maxResults
     */
    public search(_query: string, maxResults = 6): [Course[], SearchMatch[]] {
        const [query, field, queryNoSp] = this.prepQuery(_query);

        const results: Course[] = [];
        const matches: SearchMatch[] = [];
        const courses = this.courses;
        const len = courses.length;

        if (!field || field === 'num' || field === 'key')
            for (let i = 0; i < len; i++) {
                this.searchKey(queryNoSp, courses[i], results, matches);
                if (results.length >= maxResults) return [results, matches];
            }

        if (!field || field.startsWith('title'))
            for (let i = 0; i < len; i++) {
                this.searchField(query, 'title', courses[i], results, matches);
                if (results.length >= maxResults) return [results, matches];
            }

        if (!field || field.startsWith('topic'))
            for (let i = 0; i < len; i++) {
                this.searchSectionField(query, 'topic', courses[i], results, matches);
                if (results.length >= maxResults) return [results, matches];
            }

        if (!field || field.startsWith('prof'))
            for (let i = 0; i < len; i++) {
                this.searchSectionField(query, 'instructors', courses[i], results, matches);
                if (results.length >= maxResults) return [results, matches];
            }

        if (!field || field.startsWith('desc'))
            for (let i = 0; i < len; i++) {
                this.searchField(query, 'description', courses[i], results, matches);
                if (results.length >= maxResults) return [results, matches];
            }

        if (!field || field.startsWith('room'))
            for (let i = 0; i < len; i++) {
                this.searchSectionField(query, 'rooms', courses[i], results, matches);
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

    private searchSectionField(query: string, field: 'topic' | 'instructors' | 'rooms', course: Course, results: Course[], matches: SearchMatch[]) {
        // check any topic/professor match. Select the sections which only match the topic/professor
        const secMatches = new Map<number, [SectionMatch]>();
        for (const sec of course.sections) {
            const mIdx = sec[field].toLowerCase().indexOf(query);
            if (mIdx !== -1) {
                secMatches.set(sec.id, [
                    {
                        match: field,
                        start: mIdx,
                        end: mIdx + query.length
                    }
                ]);
            }
        }
        if (secMatches.size) this.appendToResult(course, secMatches, results, matches);
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
