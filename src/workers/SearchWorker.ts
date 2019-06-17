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
import { Searcher, SearchResult, ReturnMatchData, SearchOptions } from 'fast-fuzzy';
import _Course, { CourseMatch, CourseConstructorArguments } from '../models/Course';
import _Section, { SectionMatch } from '../models/Section';
import { calcOverlap } from '../utils/time';

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

let titleSearcher: Searcher<Course, SearchOptions<Course> & ReturnMatchData>;
let descripSearcher: Searcher<Course, SearchOptions<Course> & ReturnMatchData>;
let topicSearcher: Searcher<Section, SearchOptions<Section> & ReturnMatchData>;
let instrSearcher: Searcher<Section, SearchOptions<Section> & ReturnMatchData>;

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
    // initialize the searchers and store them
    if (count === 0) {
        console.time('worker prep');
        courseDict = msg.data;
        const courses = Object.values(courseDict);
        const sections: Section[] = [];
        for (const { sections: secs } of courses) sections.push(...secs);

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
            keySelector: obj => obj.instructors.join(', ')
        });

        postMessage('ready');
        console.timeEnd('worker prep');
    } else {
        const query: string = msg.data;
        const querySeg: string[] = query.split(' ').filter(x => x.length >= 3);
        querySeg.push(query);

        // elements in array: 1. score for courses, 2. score for sections, 2. number of distinct sections
        const courseScores: { [x: string]: [number, number, number] } = Object.create(null);

        const courseMap: {
            [x: string]: {
                result: SearchResult<Course>,
                class: 'title' | 'description'
            }[]
        } = Object.create(null);

        const sectionMap: {
            [x: string]: {
                result: SearchResult<Section>,
                class: 'topic' | 'instructors'
            }[]
        } = Object.create(null);

        const newSectionMap: {
            [x: string]: {
                [y: string]: {
                    result: SearchResult<Section>,
                    class: 'topic' | 'instructors'
                }[]
            }
        } = Object.create(null);

        const sectionRecorder: Set<string> = new Set();

        for (let j = 0; j < querySeg.length; j++) {
            const q = querySeg[j];
            const last = j === querySeg.length - 1;

            const coursesResults = [titleSearcher.search(q), descripSearcher.search(q),];
            const sectionsResults = [topicSearcher.search(q), instrSearcher.search(q)];

            // map search result to course (or section) and record the match score
            for (let i = 0; i < 2; i++) {
                const r = coursesResults[i];
                for (const result of r) {
                    const item = result.item;
                    const key = item.key;

                    // calculate score based on search result
                    // matching the whole query sentence would result in a higher score
                    const score = (result.score ** 3) * (i === 0 ? 1 : 0.6) * (last ? 2 : 1);

                    const tempObj = { result, class: i === 0 ? 'title' : 'description' as 'title' | 'description' };

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
                    const item = result.item;
                    const key = item.key;
                    const score = (result.score ** 3) * (i === 0 ? 0.8 : 0.6) * (last ? 2 : 1);

                    if (courseScores[key]) {
                        courseScores[key][1] += score;
                    } else {
                        courseScores[key] = [0, score, 0];
                    }

                    const tempObj = { result, class: i === 0 ? 'topic' : 'instructors' as 'topic' | 'instructors' };

                    if (newSectionMap[key]) {
                        if (newSectionMap[key][result.item.sid]) {
                            newSectionMap[key][result.item.sid].push(tempObj);
                        } else {
                            newSectionMap[key][result.item.sid] = [tempObj];
                        }
                    } else {
                        newSectionMap[key] = Object.create(null);
                        newSectionMap[key][result.item.sid.toString()] = [tempObj];
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
                    b[1][0] +
                    (b[1][2] === 0 ? 0 : b[1][1] / b[1][2]) -
                    (a[1][0] + (a[1][2] === 0 ? 0 : a[1][1] / a[1][2]))
            )
            .slice(0, 12);

        for (const [key] of scoreEntries) {
            if (courseMap[key]) {
                let len = courseMap[key].length;

                courseMap[key].sort((a, b) => a.result.match.index - b.result.match.index);

                for (let i = 0; i < len - 1; i++) {
                    const a = courseMap[key][i];
                    const b = courseMap[key][i + 1];

                    if (a.class !== b.class) continue;
                    const ovlp = calcOverlap(a.result.match.index,
                        a.result.match.index + a.result.match.length,
                        b.result.match.index,
                        b.result.match.index + b.result.match.length);
                    if (ovlp > 0) {
                        a.result.match.index = Math.min(a.result.match.index, b.result.match.index);
                        a.result.match.length = a.result.match.length + b.result.match.length - ovlp;
                        courseMap[key].splice(i + 1, 1);
                        len--;
                        i--;
                    }
                }

            }

            if (newSectionMap[key]) {

                for (const sid of Object.keys(newSectionMap[key])) {
                    if (key.indexOf('enwr') !== -1) {
                        console.log('before');
                        console.log(newSectionMap[key][sid]);
                    }
                    newSectionMap[key][sid].sort((a, b) => a.result.match.index - b.result.match.index);
                    let len = newSectionMap[key][sid].length;

                    for (let i = 0; i < len - 1; i++) {
                        const a = newSectionMap[key][sid][i];
                        const b = newSectionMap[key][sid][i + 1];

                        if (a.class !== b.class) continue;
                        const ovlp = calcOverlap(a.result.match.index,
                            a.result.match.index + a.result.match.length,
                            b.result.match.index,
                            b.result.match.index + b.result.match.length);
                        if (ovlp > 0) {
                            a.result.match.index = Math.min(a.result.match.index, b.result.match.index);
                            a.result.match.length = a.result.match.length + b.result.match.length - ovlp;
                            newSectionMap[key][sid].splice(i + 1, 1);
                            len--;
                            i--;
                        }
                    }
                    if (key.indexOf('enwr') !== -1) {
                        console.log('after');
                        console.log(newSectionMap[key][sid]);
                    }
                }
            }
        }

        const finalResults: CourseConstructorArguments[] = [];

        // merge course and section matches
        for (const [key] of scoreEntries) {
            const courseMatch = courseMap[key];
            let course: CourseConstructorArguments;
            if (courseMatch) {
                const { match, original, item } = courseMatch[0].result;

                const mats: CourseMatch[] = courseMatch
                    .map(x => [
                        {
                            match: x.class,
                            start: x.result.match.index,
                            end: x.result.match.index + x.result.match.length
                        } as CourseMatch
                    ])
                    .map(x => x[0]);

                const combSecMatches: SectionMatch[][] = [];
                const newS = newSectionMap[key];

                if (newS) {
                    const matchedSecIdx = Object.keys(newS);
                    const secMatches: { [sid: string]: SectionMatch[] } = Object.create(null);

                    for (const sid of Object.keys(newS)) {
                        secMatches[sid] = newS[sid].map(x => [{
                            match: x.class,
                            start: x.result.match.index,
                            end: x.result.match.index + x.result.match.length
                        }]).map(x => x[0]);
                    }

                    for (const sid of item.sids) {
                        if (matchedSecIdx.indexOf(sid.toString()) === -1) {
                            combSecMatches.push([]);
                        } else {
                            combSecMatches.push(secMatches[sid]);
                        }
                    }
                }
                course = [item.raw, key, item.sids, mats, combSecMatches];
                // only section match exists
            } else {
                const newS = newSectionMap[key];
                const sidKeys = Object.keys(newSectionMap[key]).sort((a, b) => parseInt(a) - parseInt(b));
                let item = newSectionMap[key][sidKeys[0]][0].result.item.course;

                const combSecMatches: SectionMatch[] = [];
                const matchedSids = sidKeys.map(x => parseInt(x));

                if (newS) {
                    for (const sid of sidKeys) {
                        combSecMatches.push(newS[sid].map(x => [{
                            match: x.class,
                            start: x.result.match.index,
                            end: x.result.match.index + x.result.match.length
                        }]).map(x => x[0]));
                    }
                }
                course = [item.raw, key, matchedSids, [], combSecMatches];
            }
            finalResults.push(course);
        }
        postMessage(finalResults);
    }
    count++;
};
