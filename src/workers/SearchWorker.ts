/**
 * Search worker is used to perform fuzzy search (which is very expensive)
 * in a separate, non-blocking process.
 * @author Hanzhi Zhou, Kaiying Cat
 * @requires optimization
 * @requires fast-fuzzy
 * @see https://github.com/EthanRutherford/fast-fuzzy
 */

/**
 *
 */
import { Searcher, SearchResult } from 'fast-fuzzy';
import _Course, { CourseConstructorArguments, CourseMatch } from '../models/Course';
import _Section, { SectionMatch } from '../models/Section';
import Course from '../models/Course';

// copied from https://www.typescriptlang.org/docs/handbook/advanced-types.html
type NonFunctionPropertyNames<T> = {
    [K in keyof T]: T[K] extends (...x: any[]) => any ? never : K
}[keyof T];
type NonFunctionProperties<T> = Pick<T, NonFunctionPropertyNames<T>>;
type Omit<T, K> = Pick<T, Exclude<keyof T, K>>;

// modified from
// https://github.com/Microsoft/TypeScript/wiki/What%27s-new-in-TypeScript#improved-control-over-mapped-type-modifiers
type Mutable<T, F extends keyof T> = { -readonly [P in F]: T[P] } &
    { [P in keyof Omit<T, F>]: T[P] };

type Course = NonFunctionProperties<Mutable<_Course, 'title' | 'description'>>;
type Section = NonFunctionProperties<Mutable<_Section, 'topic' | 'instructors'>>;

declare function postMessage(msg: CourseConstructorArguments[] | 'ready'): void;

// let courseSearcher: Searcher<Course>;
// let sectionSearcher: Searcher<Section>;

let titleSearcher: Searcher<Course>;
let descripSearcher: Searcher<Course>;
let topicSearcher: Searcher<Section>;
let instrSearcher: Searcher<Section>;

let courseDict: { [x: string]: Course };
let count = 0;

/**
 * initialize the worker using `msg.data` which is assumed to be a `courseDict` on the first message,
 * posting the string literal 'ready' as the response
 *
 * start fuzzy search using `msg.data` which is assumed to be a string for the following messages,
 * posting the array of tuples (used to construct [[Course]] instances) as the response
 */
onmessage = (msg: MessageEvent) => {
    if (count === 0) {
        console.time('worker prep');
        courseDict = msg.data;
        const courses = Object.values(courseDict);
        const sections: Section[] = [];
        for (const { sections: secs } of courses) sections.push(...secs);

        // create searcher objects for later use
        // they'll cache normalization and tries
        // so future searches won't need to re-calculate them on the fly

        // fast-fuzzy does not support nested data, so we search for sections and courses separately.

        // sectionSearcher = new Searcher(sections, {
        //     returnMatchData: true,
        //     ignoreCase: true,
        //     ignoreSymbols: true,
        //     normalizeWhitespace: true,
        //     keySelector: obj => [obj.topic, obj.instructors.join(', ')]
        // });
        // courseSearcher = new Searcher(courses, {
        //     returnMatchData: true,
        //     ignoreCase: true,
        //     ignoreSymbols: true,
        //     normalizeWhitespace: true,
        //     keySelector: obj => [obj.title, obj.description]
        // });

        titleSearcher = new Searcher(courses, {
            returnMatchData: true,
            ignoreCase: true,
            ignoreSymbols: true,
            normalizeWhitespace: true,
            keySelector: obj => obj.title
        });

        descripSearcher = new Searcher(courses, {
            returnMatchData: true,
            ignoreCase: true,
            ignoreSymbols: true,
            normalizeWhitespace: true,
            keySelector: obj => obj.description
        });

        topicSearcher = new Searcher(sections, {
            returnMatchData: true,
            ignoreCase: true,
            ignoreSymbols: true,
            normalizeWhitespace: true,
            keySelector: obj => obj.topic
        });

        instrSearcher = new Searcher(sections, {
            returnMatchData: true,
            ignoreCase: true,
            ignoreSymbols: true,
            normalizeWhitespace: true,
            keySelector: obj => obj.instructors.join(' ')
        });

        postMessage('ready');
        console.timeEnd('worker prep');
    } else {
        const query: string = msg.data;
        const querySeg: string[] = query.split(' ').filter(x => x.length >= 3);
        querySeg.push(query);

        const courseScores: { [x: string]: [number, number, number] } = Object.create(null);
        const courseMap: { [x: string]: SearchResult<Course>[] } = Object.create(null);
        const sectionMap: { [x: string]: SearchResult<Section>[] } = Object.create(null);
        const sectionRecorder: Set<string> = new Set();

        for (let j = 0; j < querySeg.length; j++) {
            const q = querySeg[j];
            const last = j === querySeg.length - 1;
            // courseResults = courseSearcher.search(q);
            // sectionResults = sectionSearcher.search(q);

            // titleResult = titleSearcher.search(q);
            // descripResult = descripSearcher.search(q);
            // topicResult = topicSearcher.search(q);

            const coursesResults = [titleSearcher.search(q), descripSearcher.search(q),];
            const sectionsResults = [topicSearcher.search(q), instrSearcher.search(q)];

            for (let i = 0; i < 2; i++) {
                const r = coursesResults[i];
                for (const result of r) {
                    const item = result.item;
                    const key = item.key;
                    const score = (result.score ** 3) * (i === 0 ? 1 : 0.6) * (last ? 2 : 1);
                    if (courseMap[key]) {
                        courseScores[key][0] += score;
                        if (!last) courseMap[key].push(result);
                    } else {
                        courseScores[key] = [score, 0, 0];
                        if (!last) courseMap[key] = [result];
                    }
                }
            }

            for (let i = 0; i < 2; i++) {
                const r = sectionsResults[i];
                for (const result of r) {
                    const item = result.item;
                    const key = item.key;
                    const score = (result.score ** 3) * (i === 0 ? 0.8 : 0.6) * (last ? 2 : 1);

                    if (courseScores[key]) {
                        courseScores[key][1] += score;
                    } else {
                        courseScores[key] = [0, score, 0];
                    }

                    if (sectionMap[key]) {
                        if (!last) sectionMap[key].push(result);
                    } else {
                        if (!last) sectionMap[key] = [result];
                    }

                    const secKey = `${item.key} ${item.sid}`;

                    if (!sectionRecorder.has(secKey) && !last) {
                        courseScores[key][2] += 1;
                        sectionRecorder.add(secKey);
                    }
                }
            }
            // for (const result of courseResults) {
            //     const item = result.item;
            //     const key = item.key;
            //     const score = result.score * (result.original === item.title ? 1 : 0.5);
            //     if (courseMap[key]) {
            //         courseScores[key][0] += score;
            //         courseMap[key].push(result);
            //     } else {
            //         courseScores[key] = [score, 0, 0];
            //         courseMap[key] = [result];
            //     }
            // }

            // for (const result of sectionResults) {
            //     const item = result.item;
            //     const key = item.key;
            //     const score = result.score * (result.original === item.topic ? 0.8 : 0.4);

            //     if (courseScores[key]) {
            //         courseScores[key][1] += score;
            //     } else {
            //         courseScores[key] = [0, score, 0];
            //     }

            //     if (sectionMap[key]) {
            //         sectionMap[key].push(result);
            //     } else {
            //         sectionMap[key] = [result];
            //     }

            //     const secKey = `${item.key} ${item.sid}`;

            //     if (!sectionRecorder.has(secKey)) {
            //         courseScores[key][2] += 1;
            //         sectionRecorder.add(secKey);
            //     }
            // }
        }

        // sort courses in descending order; section score is normalized before added to course score
        Object.entries(courseScores)
            .sort(
                (a, b) =>
                    b[1][0] +
                    (b[1][2] === 0 ? 0 : b[1][1] / b[1][2]) -
                    (a[1][0] + (a[1][2] === 0 ? 0 : a[1][1] / a[1][2]))
            )
            .filter(x => x[0].indexOf('cs') !== -1).map(x => console.log(x));

        const scoreEntries = Object.entries(courseScores)
            .sort(
                (a, b) =>
                    b[1][0] +
                    (b[1][2] === 0 ? 0 : b[1][1] / b[1][2]) -
                    (a[1][0] + (a[1][2] === 0 ? 0 : a[1][1] / a[1][2]))
            )
            .slice(0, 12);

        const finalResults: CourseConstructorArguments[] = [];

        // merge course and section matches
        for (const [key] of scoreEntries) {
            const courseMatch = courseMap[key];
            let course: CourseConstructorArguments;
            if (courseMatch) {
                const { match, original, item } = courseMatch[0];

                const mats: CourseMatch[] = courseMatch
                    .map(x => [
                        {
                            match: x.original === x.item.title ? 'title' : 'description',
                            start: x.match.index,
                            end: x.match.index + x.match.length
                        } as CourseMatch
                    ])
                    .map(x => x[0]);

                const combSecMatches: SectionMatch[][] = [];
                const s = sectionMap[key];

                // both course and section matches exist for this key
                if (s) {
                    const matchedSecIdx = s.map(x => x.item.sid);
                    const secMatches = s.map(x => [
                        {
                            match: x.original === x.item.topic ? 'topic' : 'instructors',
                            start: x.match.index,
                            end: x.match.index + x.match.length
                        } as SectionMatch
                    ]);
                    for (const sid of item.sids) {
                        const idx = matchedSecIdx.findIndex(x => x === sid);
                        if (idx === -1) {
                            combSecMatches.push([]);
                        } else {
                            combSecMatches.push(secMatches[idx]);
                        }
                    }
                }
                course = [item.raw, key, item.sids, mats, combSecMatches];
                // only section match exists
            } else {
                const s = sectionMap[key];
                course = [
                    s[0].item.course.raw,
                    key,
                    s.map(x => x.item.sid),
                    [],
                    s.map(x => [
                        {
                            match: x.original === x.item.topic ? 'topic' : 'instructors',
                            start: x.match.index,
                            end: x.match.index + x.match.length
                        } as SectionMatch
                    ])
                ];
            }
            finalResults.push(course);
        }
        postMessage(finalResults);
    }
    count++;
};
