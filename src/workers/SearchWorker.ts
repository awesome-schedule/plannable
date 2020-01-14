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
import { RawAlgoCourse } from '@/algorithm/ScheduleGenerator';
import { SearchMatch } from '@/models/Catalog';
import _Course, { CourseMatch } from '../models/Course';
import _Meeting from '../models/Meeting';
import { SectionFields, SectionMatch } from '../models/Section';
import { blockUnion } from '@/utils';

type Section = Omit<SectionFields, 'course'>;
interface Course extends Omit<NonFunctionProperties<_Course>, 'sections'> {}

declare function postMessage(msg: [RawAlgoCourse[], SearchMatch[]] | 'ready'): void;

/**
 * @license MIT
 * Adapted from [[https://github.com/aceakash/string-similarity]], with optimizations:
 * 1. Cache the string length
 * 2. No need to use .has for map
 * 3. Pre-process the target list of strings for repeated searches (see [[FastSearcher]])
 * About 40% faster than the original one.
 * @param first
 * @param second
 */
function findBestMatch(first: string, targetStrings: string[]) {
    const len = targetStrings.length;
    const allMatches: number[][] = [];
    const firstBigrams = new Map<string, number>();
    for (let i = 0; i < len; i++) {
        const second = targetStrings[i];
        const len1 = first.length,
            len2 = second.length;
        // if (!len1 && !len2) return [1, [0, 0]] as const; // if both are empty strings
        // if (!len1 || !len2) return [0, []] as const; // if only one is empty string
        // if (first === second) return [1, [0, len1]] as const; // identical
        // if (len1 === 1 && len2 === 1) return [0, []] as const; // both are 1-letter strings
        // if (len1 < 2 || len2 < 2) return [0, []] as const; // if either is a 1-letter string

        for (let j = 0; j < len1 - 1; j++) {
            const bigram = first.substring(j, j + 2);
            firstBigrams.set(bigram, 1 + (firstBigrams.get(bigram) || 0));
        }

        let intersectionSize = 0;
        const matches = [0.0, i];
        for (let j = 0; j < len2 - 1; j++) {
            const bigram = second.substring(j, j + 2);
            const count = firstBigrams.get(bigram) || 0;

            if (count > 0) {
                firstBigrams.set(bigram, count - 1);
                intersectionSize++;
                matches.push(j, j + 2);
            }
        }

        matches[0] = (2 * intersectionSize) / (len1 + len2 - 2);
        for (let j = 2; j < matches.length - 2; j += 2) {
            const union = blockUnion(matches[j], matches[j + 1], matches[j + 2], matches[j + 3]);
            if (union) {
                matches.splice(j, 4, union[0], union[1]);
                j -= 2;
            }
        }
        allMatches.push(matches);
        firstBigrams.clear();
    }
    return allMatches.sort((a, b) => b[0] - a[0]);
}
/**
 * Fast searcher for fuzzy search among a list of strings
 */
class FastSearcher<T> {
    public targets: string[];
    /**
     * @param targets the list of strings to search from
     */
    constructor(targets: T[], toStr: (a: T) => string) {
        this.targets = targets.map(
            t => toStr(t).toLowerCase()
            // .replace(/\s+/g, '')
        );
    }
    public search(query: string) {
        const arr = findBestMatch(query.toLowerCase().replace(/\s+/g, ''), this.targets);
        // for (let i = 0; i < 5; i++) {
        //     const temp = arr[i];
        //     const str = this.targets[temp[1]];
        //     let l = '';
        //     for (let j = 2; j < temp.length; j += 2) {
        //         l += str.substring(temp[j], temp[j + 1]) + ' ';
        //     }
        //     console.log(l);
        // }
        // console.log(arr);
        return arr;
    }
    public toJSON() {
        return this.targets;
    }
}

// function processCourseResults(
//     results: SearchResult<Course>[],
//     courseMap: CourseMap,
//     scores: Scores,
//     match: 'title' | 'description',
//     weight: number
// ) {
//     for (const result of results) {
//         const key = result.item.key;
//         const score = result.score ** 3 * weight;
//         const tempObj = {
//             result,
//             match
//         };
//         if (courseMap[key]) {
//             scores[key][0] += score;
//             courseMap[key].push(tempObj);
//         } else {
//             // if encounter this course for the first time
//             scores[key] = [score, 0, 0];
//             courseMap[key] = [tempObj];
//         }
//     }
// }

interface ResultMap {
    [x: string]: number[];
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

const searchers: FastSearcher<any>[] = [];

let courses: Course[];
let sections: Section[];
/**
 * initialize the worker using `msg.data` which is assumed to be a `courseDict` on the first message,
 * posting the string literal 'ready' as the response
 *
 * start fuzzy search using `msg.data` which is assumed to be a string for the following messages,
 * posting the array of tuples (used to construct [[Course]] instances) as the response
 */
onmessage = ({ data }: { data: [Course[], Section[]] | string }) => {
    // initialize the searchers and store them
    if (typeof data !== 'string') {
        console.time('worker prep');
        [courses, sections] = data;
        searchers.push(
            new FastSearcher(courses, obj => obj.title),
            new FastSearcher(courses, obj => obj.description),
            new FastSearcher(sections, obj => obj.topic),
            new FastSearcher(sections, obj => obj.instructors.join(' '))
        );

        postMessage('ready');
        console.timeEnd('worker prep');
    } else {
        const query = data.trim().toLowerCase();
        const querySeg: string[] = query.split(/ +/).filter(x => x.length >= 3);
        querySeg.push(query);

        const resultMaps: ResultMap[] = [
            Object.create(null),
            Object.create(null),
            Object.create(null),
            Object.create(null)
        ];
        const targets = [courses, courses, sections, sections] as const;
        for (let j = 0; j < querySeg.length; j++) {
            const q = querySeg[j];
            // map search result to course (or section) and record the match score
            for (let i = 0; i < 4; i++) {
                const results = searchers[i].search(q);
                const rMap = resultMaps[i];
                const target = targets[i];
                for (const result of results) {
                    const idx = result[1];
                    const item = target[idx];
                    if (rMap[item.key]) {
                        rMap[item.key] = result;
                    } else {
                        rMap[item.key] = result;
                    }
                }
            }
        }

        const weights = [1, 0.5, 0.8, 0.4] as const;
        const fields = ['title', 'description'];

        const scores: Scores = Object.create(null);
        for (let i = 0; i < 2; i++) {
            const rMap = resultMaps[i];
            const target = targets[i];
            for (const key in rMap) {
                const score = scores[key] || [0, 0, 0];
                score[0] += rMap[key][0] * weights[i];
                scores[key] = score;
            }
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
            const crsMatches: CourseMatch[] = [];
            for (let i = 0; i < 2; i++) {
                const matches = resultMaps[i][key];
                const field = fields[i];
                if (matches) {
                    for (let i = 2; i < matches.length; i += 2) {
                        crsMatches.push({
                            match: field as any,
                            start: matches[i],
                            end: matches[i + 1]
                        });
                    }
                }
            }
            if (crsMatches.length) {
                // const crs = courses[(resultMaps[0][key] || resultMaps[1][key])[0][1]];
                finalResults.push([key, []]);
                allMatches.push([crsMatches, new Map()]);
            }

            // if (courseMatch) {
            //     const secMatches = new Map<number, SectionMatch[]>();
            //     const s = sectionMap[key];
            //     // if the section matches for this course exist
            //     if (s) {
            //         for (const [id, matches] of s) {
            //             secMatches.set(
            //                 id,
            //                 matches.map(({ match, result: { match: m } }) => ({
            //                     match,
            //                     start: m.index,
            //                     end: m.index + m.length
            //                 }))
            //             );
            //         }
            //     }
            //     finalResults.push([key, courseMatch[0].result.item.ids]);
            //     allMatches.push([crsMatches, secMatches]);

            //     // only section match exists
            // } else {
            //     const secMatches = new Map<number, SectionMatch[]>();
            //     const s = sectionMap[key];
            //     if (s) {
            //         const ids = [...s.keys()];
            //         for (const [id, matches] of s) {
            //             secMatches.set(
            //                 id,
            //                 matches.map(({ match, result: { match: m } }) => ({
            //                     match,
            //                     start: m.index,
            //                     end: m.index + m.length
            //                 }))
            //             );
            //         }
            //         finalResults.push([key, ids]);
            //         allMatches.push([[], secMatches]);
            //     }
            // }
        }
        console.log([finalResults, allMatches]);
        postMessage([finalResults, allMatches]);
    }
};
