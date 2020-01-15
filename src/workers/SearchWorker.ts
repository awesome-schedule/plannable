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
import _Course, { CourseMatch, Match } from '../models/Course';
import _Meeting from '../models/Meeting';
import { SectionFields, SectionMatch } from '../models/Section';
import { calcOverlap } from '@/utils';

type Section = Omit<SectionFields, 'course'>;
interface Course extends Omit<NonFunctionProperties<_Course>, 'sections'> {}

declare function postMessage(msg: [RawAlgoCourse[], SearchMatch[]] | 'ready'): void;

interface SearchResult<T, K> {
    score: number;
    matches: number[];
    index: number;
    item: T;
    data: K;
}
/**
 * Fast searcher for fuzzy search among a list of strings
 */
class FastSearcher<T, K = string> {
    public targets: string[][];
    public indices: Uint16Array[];
    public items: T[];
    public data: K;
    /**
     * @param targets the list of strings to search from
     */
    constructor(targets: T[], toStr: (a: T) => string, data: K) {
        this.items = targets;
        this.indices = [];
        this.targets = targets.map(t => {
            const full = toStr(t).toLowerCase();
            const temp = full.split(/\s+/);
            const idx = new Uint16Array(temp.length + 1);
            for (let i = 0; i < temp.length; i++) {
                idx[i] = full.indexOf(temp[i]);
            }
            idx[temp.length] = full.length;
            this.indices.push(idx);
            return temp;
        });
        this.data = data;
    }
    public search(first: string) {
        first = first.toLowerCase().replace(/\s+/g, '');

        const temp = new Map<string, number>();
        const len1 = first.length;
        for (let j = 0; j < len1 - 1; j++) {
            const bigram = first.substring(j, j + 2);
            temp.set(bigram, 1 + (temp.get(bigram) || 0));
        }

        const allMatches: SearchResult<T, K>[] = [];
        for (let i = 0; i < this.targets.length; i++) {
            // if (!len1 && !len2) return [1, [0, 0]] as const; // if both are empty strings
            // if (!len1 || !len2) return [0, []] as const; // if only one is empty string
            // if (first === second) return [1, [0, len1]] as const; // identical
            // if (len1 === 1 && len2 === 1) return [0, []] as const; // both are 1-letter strings
            // if (len1 < 2 || len2 < 2) return [0, []] as const; // if either is a 1-letter string

            const matches = [];
            const tokens = this.targets[i];
            const indices = this.indices[i];
            let score = 0;
            for (let k = 0; k < tokens.length; k++) {
                const token = tokens[k];
                const start = indices[k];
                let intersectionSize = 0;
                const len2 = token.length;
                const firstBigrams = new Map(temp);

                for (let j = 0; j < len2 - 1; j++) {
                    const bigram = token.substring(j, j + 2);
                    const count = firstBigrams.get(bigram) || 0;

                    if (count > 0) {
                        firstBigrams.set(bigram, count - 1);
                        intersectionSize++;
                        matches.push(start + j, start + j + 2);
                    }
                }
                if (intersectionSize < 2) {
                    matches.splice(matches.length - intersectionSize * 2);
                    continue;
                }

                const t1 = (2 * intersectionSize) / (len1 + len2 - 2);
                if (t1 > score) {
                    score = t1;
                }
            }

            // for (let j = 0; j < matches.length; j += 2) {
            //     const union = blockUnion(
            //         matches[j],
            //         matches[j + 1],
            //         matches[j + 2],
            //         matches[j + 3]
            //     );
            //     if (union) {
            //         matches.splice(j, 4, union[0], union[1]);
            //         j -= 2;
            //     }
            // }

            allMatches.push({
                score,
                matches,
                item: this.items[i],
                index: i,
                data: this.data
            });
        }
        return allMatches.sort((a, b) => b.score - a.score);
    }
    public toJSON() {
        return this.targets;
    }
}

let titleSearcher: FastSearcher<Course>;
let descriptionSearcher: FastSearcher<Course>;
let topicSearcher: FastSearcher<Section>;
let instrSearcher: FastSearcher<Section>;

function processCourseResults(results: SearchResult<Course, string>[], weight: number) {
    for (const result of results) {
        const key = result.item.key;
        const score = result.score ** 3 * weight;

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

function processSectionResults(results: SearchResult<Section, string>[], weight: number) {
    for (const result of results) {
        const item = result.item;
        const key = item.key;
        const score = result.score ** 3 * weight;

        let scoreEntry = scores.get(key);
        if (!scoreEntry) {
            scoreEntry = [0, 0, 0];
            scores.set(key, scoreEntry);
        }
        scoreEntry[1] += score;

        const secMatches = sectionMap.get(key);
        if (secMatches) {
            const matches = secMatches.get(item.id);
            if (matches) {
                matches.push(result);
            } else {
                secMatches.set(item.id, [result]);
                // if encounter a new section of a course, increment the number of section recorded
                scoreEntry[2] += 1;
            }
        } else {
            sectionMap.set(key, new Map().set(item.id, [result]));
            scoreEntry[2] += 1;
        }
    }
}

type CourseResultMap = Map<string, SearchResult<Course, string>[]>;
type SectionResultMap = Map<string, Map<number, SearchResult<Section, string>[]>>;
/**
 * elements in array:
 * 1. score for courses,
 * 2. score for sections,
 * 3. number of distinct sections
 */
type ScoreEntry = [number, number, number];
type Scores = Map<string, ScoreEntry>;

const courseMap: CourseResultMap = new Map();
const sectionMap: SectionResultMap = new Map();
const scores: Scores = new Map();

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

        titleSearcher = new FastSearcher(courses, obj => obj.title, 'title');
        descriptionSearcher = new FastSearcher(courses, obj => obj.description, 'description');
        topicSearcher = new FastSearcher(sections, obj => obj.topic, 'topic');
        instrSearcher = new FastSearcher(sections, obj => obj.instructors.join(' '), 'instructors');

        postMessage('ready');
        console.timeEnd('worker prep');
    } else {
        const query = data.trim().toLowerCase();
        const querySeg: string[] = query.split(/ +/).filter(x => x.length >= 3);
        querySeg.push(query);

        for (let j = 0; j < querySeg.length; j++) {
            const q = querySeg[j];
            // matching the whole query sentence would result in a higher score
            const weight = +(j === querySeg.length - 1) * 2;

            processCourseResults(titleSearcher.search(q), weight);
            processCourseResults(descriptionSearcher.search(q), 0.5 * weight);
            processSectionResults(topicSearcher.search(q), 0.8 * weight);
            processSectionResults(instrSearcher.search(q), 0.4 * weight);
        }

        // sort courses in descending order; section score is normalized before added to course score
        const scoreEntries = Array.from(scores.entries())
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
            const courseMatch = courseMap.get(key);
            const secMatches = new Map<number, SectionMatch[]>();
            const s = sectionMap.get(key);
            if (courseMatch) {
                const crsMatches: CourseMatch[] = toMatches(courseMatch);
                // if the section matches for this course exist
                if (s) {
                    for (const [id, matches] of s) {
                        secMatches.set(id, toMatches(matches));
                    }
                }
                finalResults.push([key, courseMatch[0].item.ids]);
                allMatches.push([crsMatches, secMatches]);
                // only section match exists
            } else {
                // if the section matches for this course exist
                if (s) {
                    for (const [id, matches] of s) {
                        secMatches.set(id, toMatches(matches));
                    }
                }
                finalResults.push([key, [...secMatches.keys()]]);
                allMatches.push([[], secMatches]);
            }
        }
        console.log(finalResults, allMatches);
        postMessage([finalResults, allMatches]);

        courseMap.clear();
        sectionMap.clear();
        scores.clear();
    }
};

function resolveOverlap(arr: Match<any>[]) {
    arr.sort((a, b) => a.start - b.start);
    for (let i = 0; i < arr.length - 1; i++) {
        let j = i + 1;
        const a = arr[i];
        let b = arr[j];

        while (a.match !== b.match && j + 1 < arr.length) {
            b = arr[++j];
        }

        if (a.match !== b.match) continue;
        const ovlp = calcOverlap(a.start, a.end, b.start, b.end);
        if (ovlp > 0) {
            const prevStart = a.start;
            (a as any).start = Math.min(a.start, b.start);
            (a as any).end = a.end - prevStart + a.start + b.end - b.start - ovlp;
            arr.splice(j, 1);
            i--;
        }
    }
    return arr;
}

function toMatches(matches: SearchResult<any, any>[]) {
    const allMatches: Match<any>[] = [];
    for (const { data, matches: m } of matches) {
        for (let i = 0; i < m.length; i += 2) {
            allMatches.push({
                match: data as any,
                start: m[i],
                end: m[i + 1]
            });
        }
    }
    return resolveOverlap(allMatches);
}
