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
import { SearchMatch } from '@/models/Catalog';
import { ReturnMatchData, Searcher, SearchOptions, SearchResult } from 'fast-fuzzy';
import _Course, { CourseConstructorArguments, CourseFields, CourseMatch } from '../models/Course';
import _Meeting from '../models/Meeting';
import _Section, { SectionMatch } from '../models/Section';
import { calcOverlap } from '../utils/time';

// functions cannot be cloned via structured cloning
type Meeting = NonFunctionProperties<_Meeting>;
interface Section extends Pick<
    _Section,
    // course fields are defined as getters which cannot be cloned
    Exclude<NonFunctionPropertyNames<_Section>, keyof CourseFields | undefined | 'meetings'>
> {
    readonly meetings: readonly Meeting[];
}
interface Course extends Pick<_Course, Exclude<NonFunctionPropertyNames<_Course>, 'sections'>> {
    readonly sections: readonly Section[];
}

declare function postMessage(msg: [CourseConstructorArguments[], SearchMatch[]] | 'ready'): void;

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

        // elements in array: 1. score for courses, 2. score for sections, 2. number of distinct sections
        const courseScores: { [x: string]: [number, number, number] } = Object.create(null);

        const courseMap: {
            [x: string]: ResultEntry<Course, 'title' | 'description'>[];
        } = Object.create(null);

        const sectionMap: {
            [x: string]: Map<number, ResultEntry<Section, 'topic' | 'instructors'>[]>;
        } = Object.create(null);

        const sectionRecorder: Set<string> = new Set();

        for (let j = 0; j < querySeg.length; j++) {
            const q = querySeg[j];
            const last = j === querySeg.length - 1;

            const coursesResults = [titleSearcher.search(q), descriptionSearcher.search(q)];
            const sectionsResults = [topicSearcher.search(q), instrSearcher.search(q)];

            // map search result to course (or section) and record the match score
            for (let i = 0; i < 2; i++) {
                const r = coursesResults[i];
                for (const result of r) {
                    const { item } = result;
                    const key = item.key;

                    // calculate score based on search result
                    // matching the whole query sentence would result in a higher score
                    const score = result.score ** 3 * (i === 0 ? 1 : 0.6) * (last ? 2 : 1);

                    const tempObj: ResultEntry<Course, 'title' | 'description'> = {
                        result,
                        match: i === 0 ? 'title' : 'description'
                    };

                    if (courseMap[key]) {
                        courseScores[key][0] += score;
                        courseMap[key].push(tempObj);
                    } else {
                        // if encounter this course for the first time
                        courseScores[key] = [score, 0, 0];
                        courseMap[key] = [tempObj];
                    }
                }
            }

            for (let i = 0; i < 2; i++) {
                const r = sectionsResults[i];
                for (const result of r) {
                    const { item } = result;
                    const key = item.key;
                    const score = result.score ** 3 * (i === 0 ? 0.8 : 0.6) * (last ? 2 : 1);

                    if (courseScores[key]) {
                        courseScores[key][1] += score;
                    } else {
                        courseScores[key] = [0, score, 0];
                    }

                    const tempObj: ResultEntry<Section, 'topic' | 'instructors'> = {
                        result,
                        match: i === 0 ? 'topic' : 'instructors'
                    };

                    if (sectionMap[key]) {
                        const secMatches = sectionMap[key].get(item.sid);
                        if (secMatches) {
                            secMatches.push(tempObj);
                        } else {
                            sectionMap[key].set(item.sid, [tempObj]);
                        }
                    } else {
                        sectionMap[key] = new Map();
                        sectionMap[key].set(item.sid, [tempObj]);
                    }

                    const secKey = `${item.key} ${item.sid}`;

                    // if encounter a new section of a course, increment the number of section recorded
                    if (!sectionRecorder.has(secKey) && !last) {
                        courseScores[key][2] += 1;
                        sectionRecorder.add(secKey);
                    }
                }
            }
        }

        // sort courses in descending order; section score is normalized before added to course score
        const scoreEntries = Object.entries(courseScores)
            .sort(
                (a, b) =>
                    b[1][0] -
                    a[1][0] +
                    (b[1][2] && b[1][1] / b[1][2]) -
                    (a[1][2] && a[1][1] / a[1][2])
            )
            .slice(0, 12);

        const finalResults: CourseConstructorArguments[] = [];
        const allMatches: SearchMatch[] = [];

        // merge course and section matches
        for (const [key] of scoreEntries) {
            const courseMatch = courseMap[key];
            if (courseMatch) {
                resolveOverlap(courseMatch);

                const { item } = courseMatch[0].result;

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
                    for (const [sid, matches] of s) {
                        resolveOverlap(matches);
                        secMatches.set(
                            sid,
                            matches.map(({ match, result: { match: m } }) => ({
                                match,
                                start: m.index,
                                end: m.index + m.length
                            }))
                        );
                    }
                }
                finalResults.push([item.raw, key, item.sids]);
                allMatches.push([crsMatches, secMatches]);

                // only section match exists
            } else {
                const secMatches = new Map<number, SectionMatch[]>();
                const s = sectionMap[key];
                if (s) {
                    const sids = [...s.keys()];
                    for (const [sid, matches] of s) {
                        resolveOverlap(matches);
                        secMatches.set(
                            sid,
                            matches.map(({ match, result: { match: m } }) => ({
                                match,
                                start: m.index,
                                end: m.index + m.length
                            }))
                        );
                    }
                    finalResults.push([
                        courseDict[s.get(sids[0])![0].result.item.key].raw,
                        key,
                        sids
                    ]);
                    allMatches.push([[], secMatches]);
                }
            }
        }
        postMessage([finalResults, allMatches]);
    }
};
