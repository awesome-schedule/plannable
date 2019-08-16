/**
 * Search worker is used to perform fuzzy search (which is very expensive)
 * in a separate, non-blocking process.
 * @author Kaiying Cat, Hanzhi Zhou
 * @requires optimization
 * @requires fast-fuzzy
 * @see https://github.com/EthanRutherford/fast-fuzzy
 */

/**
 *
 */
import { RawAlgoCourse } from '@/algorithm';
import { SearchMatch } from '@/models/Catalog';
import { ReturnMatchData, Searcher, SearchOptions, SearchResult } from 'fast-fuzzy';
import _Course, { CourseMatch } from '../models/Course';
import _Meeting from '../models/Meeting';
import { SectionFields, SectionMatch } from '../models/Section';
import { calcOverlap } from '../utils/time';

type Section = SectionFields;
interface Course extends Omit<NonFunctionProperties<_Course>, 'sections'> {
    readonly sections: readonly Section[];
}

declare function postMessage(msg: [RawAlgoCourse[], SearchMatch[]] | 'ready'): void;

type _Searcher<T> = Searcher<T, SearchOptions<T> & ReturnMatchData>;
let titleSearcher: _Searcher<Course>;
let descriptionSearcher: _Searcher<Course>;
let topicSearcher: _Searcher<Section>;
let instrSearcher: _Searcher<Section>;
const searcherOpts = {
    returnMatchData: true,
    ignoreCase: true,
    ignoreSymbols: true,
    normalizeWhitespace: true
} as const;

let courseDict: { [x: string]: Course };

interface ResultEntry<T, K extends keyof SearchResult<T>['item']> {
    result: SearchResult<T>;
    match: K;
}

function resolveOverlap<T, K extends keyof SearchResult<T>['item']>(arr: ResultEntry<T, K>[]) {
    let len = arr.length;
    arr.sort((a, b) => a.result.match.index - b.result.match.index);
    for (let i = 0; i < len - 1; i++) {
        let j = i + 1;
        const a = arr[i];
        let b = arr[j];

        while (a.match !== b.match && j + 1 < len) {
            b = arr[++j];
        }

        if (a.match !== b.match) continue;
        const ovlp = calcOverlap(
            a.result.match.index,
            a.result.match.index + a.result.match.length,
            b.result.match.index,
            b.result.match.index + b.result.match.length
        );
        if (ovlp > 0) {
            a.result.match.index = Math.min(a.result.match.index, b.result.match.index);
            a.result.match.length = a.result.match.length + b.result.match.length - ovlp;
            arr.splice(j, 1);
            len--;
            i--;
        }
    }
}

interface Scores {
    /**
     * elements in array:
     * 1. score for courses,
     * 2. score for sections,
     * 3. number of distinct sections
     */
    [x: string]: [number, number, number];
}
interface CourseMap {
    [x: string]: ResultEntry<Course, 'title' | 'description'>[];
}
interface SectionMap {
    [x: string]: Map<number, ResultEntry<Section, 'topic' | 'instructors'>[]>;
}

function processCourseResults(
    results: SearchResult<Course>[],
    courseMap: CourseMap,
    scores: Scores,
    match: 'title' | 'description',
    weight: number
) {
    for (const result of results) {
        const key = result.item.key;
        const score = result.score ** 3 * weight;
        const tempObj = {
            result,
            match
        };
        if (courseMap[key]) {
            scores[key][0] += score;
            courseMap[key].push(tempObj);
        } else {
            // if encounter this course for the first time
            scores[key] = [score, 0, 0];
            courseMap[key] = [tempObj];
        }
    }
}

function processSectionResults(
    results: SearchResult<Section>[],
    sectionMap: SectionMap,
    scores: Scores,
    match: 'topic' | 'topic',
    weight: number
) {
    for (const result of results) {
        const item = result.item;
        const key = item.key;
        const score = result.score ** 3 * weight;

        const scoreEntry = scores[key] || (scores[key] = [0, 0, 0]);
        scoreEntry[1] += score;

        const tempObj = {
            result,
            match
        };
        if (sectionMap[key]) {
            const secMatches = sectionMap[key].get(item.id);
            if (secMatches) {
                secMatches.push(tempObj);
            } else {
                sectionMap[key].set(item.id, [tempObj]);
                // if encounter a new section of a course, increment the number of section recorded
                scoreEntry[2] += 1;
            }
        } else {
            sectionMap[key] = new Map().set(item.id, [tempObj]);
            scoreEntry[2] += 1;
        }
    }
}

/**
 * initialize the worker using `msg.data` which is assumed to be a `courseDict` on the first message,
 * posting the string literal 'ready' as the response
 *
 * start fuzzy search using `msg.data` which is assumed to be a string for the following messages,
 * posting the array of tuples (used to construct [[Course]] instances) as the response
 */
onmessage = ({ data }: { data: { [x: string]: Course } | string }) => {
    // initialize the searchers and store them
    if (typeof data !== 'string') {
        console.time('worker prep');
        courseDict = data;
        const courses = Object.values(courseDict);
        const sections = courses.reduce((secs: Section[], course) => {
            secs.push(...course.sections);
            return secs;
        }, []);

        titleSearcher = new Searcher(courses, {
            ...searcherOpts,
            keySelector: obj => obj.title
        });
        descriptionSearcher = new Searcher(courses, {
            ...searcherOpts,
            keySelector: obj => obj.description
        });
        topicSearcher = new Searcher(sections, {
            ...searcherOpts,
            keySelector: obj => obj.topic
        });
        instrSearcher = new Searcher(sections, {
            ...searcherOpts,
            keySelector: obj => obj.instructors.join(', ')
        });

        postMessage('ready');
        console.timeEnd('worker prep');
    } else {
        const query = data.trim().toLowerCase();
        const querySeg: string[] = query.split(/ +/).filter(x => x.length >= 3);
        querySeg.push(query);

        const scores: Scores = Object.create(null);
        const courseMap: CourseMap = Object.create(null);
        const sectionMap: SectionMap = Object.create(null);

        for (let j = 0; j < querySeg.length; j++) {
            const q = querySeg[j];
            // matching the whole query sentence would result in a higher score
            const weight = +(j === querySeg.length - 1) * 2;

            // map search result to course (or section) and record the match score
            processCourseResults(titleSearcher.search(q), courseMap, scores, 'title', weight);
            processCourseResults(
                descriptionSearcher.search(q),
                courseMap,
                scores,
                'description',
                0.5 * weight
            );
            processSectionResults(
                topicSearcher.search(q),
                sectionMap,
                scores,
                'topic',
                0.8 * weight
            );
            processSectionResults(
                instrSearcher.search(q),
                sectionMap,
                scores,
                'topic',
                0.4 * weight
            );
        }

        // sort courses in descending order; section score is normalized before added to course score
        const scoreEntries = Object.entries(scores)
            .sort(
                (a, b) =>
                    b[1][0] -
                    a[1][0] +
                    (b[1][2] && b[1][1] / b[1][2]) -
                    (a[1][2] && a[1][1] / a[1][2])
            )
            .slice(0, 12);

        const finalResults: RawAlgoCourse[] = [];
        const allMatches: SearchMatch[] = [];

        // merge course and section matches
        for (const [key] of scoreEntries) {
            const courseMatch = courseMap[key];
            if (courseMatch) {
                resolveOverlap(courseMatch);

                const crsMatches: CourseMatch[] = courseMatch.map(
                    ({ match, result: { match: m } }) => ({
                        match,
                        start: m.index,
                        end: m.index + m.length
                    })
                );

                const secMatches = new Map<number, SectionMatch[]>();
                const s = sectionMap[key];
                // if the section matches for this course exist
                if (s) {
                    for (const [id, matches] of s) {
                        resolveOverlap(matches);
                        secMatches.set(
                            id,
                            matches.map(({ match, result: { match: m } }) => ({
                                match,
                                start: m.index,
                                end: m.index + m.length
                            }))
                        );
                    }
                }
                finalResults.push([key, courseMatch[0].result.item.ids]);
                allMatches.push([crsMatches, secMatches]);

                // only section match exists
            } else {
                const secMatches = new Map<number, SectionMatch[]>();
                const s = sectionMap[key];
                if (s) {
                    const ids = [...s.keys()];
                    for (const [id, matches] of s) {
                        resolveOverlap(matches);
                        secMatches.set(
                            id,
                            matches.map(({ match, result: { match: m } }) => ({
                                match,
                                start: m.index,
                                end: m.index + m.length
                            }))
                        );
                    }
                    finalResults.push([key, ids]);
                    allMatches.push([[], secMatches]);
                }
            }
        }
        postMessage([finalResults, allMatches]);
    }
};
