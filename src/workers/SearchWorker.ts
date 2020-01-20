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

declare function postMessage(msg: [string, [RawAlgoCourse[], SearchMatch[]]] | 'ready'): void;

interface SearchResult<T, K = string> {
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
    public originals: string[] = [];

    public idxOffsets: Uint32Array;
    public indices: Uint32Array;

    private num2str: string[] = [];
    private maxTokenLen: number = 0;

    /**
     * @param targets the list of strings to search from
     */
    constructor(public items: T[], toStr: (a: T) => string, public data: K) {
        const allTokens: string[][] = [];
        let tokenLen = 0;
        this.idxOffsets = new Uint32Array(items.length + 1);
        for (let i = 0; i < items.length; i++) {
            const full = toStr(items[i])
                .toLowerCase()
                .trimEnd();
            const temp = full.split(/\s+/);
            this.originals.push(full);
            allTokens.push(temp);

            this.idxOffsets[i] = tokenLen;
            tokenLen += temp.length << 1;
            if (temp.length > this.maxTokenLen) this.maxTokenLen = temp.length;
        }
        this.idxOffsets[items.length] = tokenLen;

        this.indices = new Uint32Array(tokenLen);
        const str2num: Map<string, number> = new Map();
        for (let j = 0; j < allTokens.length; j++) {
            const tokens = allTokens[j];
            const offset = this.idxOffsets[j];
            const t0 = tokens[0];
            if (str2num.get(t0) === undefined) {
                str2num.set(t0, this.num2str.length);
                this.num2str.push(t0);
            }
            this.indices[offset] = str2num.get(t0)!;
            const original = this.originals[j];
            for (let i = 1; i < tokens.length; i++) {
                const token = tokens[i];
                if (str2num.get(token) === undefined) {
                    str2num.set(token, this.num2str.length);
                    this.num2str.push(token);
                }
                this.indices[offset + (i << 1)] = str2num.get(token)!;
                this.indices[offset + (i << 1) + 1] = original.indexOf(
                    token,
                    this.indices[offset + (i << 1) - 1] + tokens[i - 1].length
                );
            }
        }

        console.log('all tokens', tokenLen);
        console.log('unique tokens', this.num2str.length);
    }
    /**
     * sliding window search
     * @param query
     * @param maxWindow
     * @param gramLen
     */
    public sWSearch(query: string, gramLen = 3, threshold = 0.03, maxWindow?: number) {
        const t2 = query
            .trim()
            .toLowerCase()
            .split(/\s+/);
        query = t2.join(' ');
        if (query.length <= 2) return [];

        maxWindow = Math.max(maxWindow || t2.length, 2);

        /** map from n-gram to index in the frequency array */
        const queryGrams = new Map<string, number>();
        const queryGramCount = query.length - gramLen + 1;

        // keep frequencies in separated arrays for performance reasons
        // copying a Map is slow, but copying a typed array is fast
        const buffer = new ArrayBuffer(queryGramCount * 2);
        const freqCount = new Uint8Array(buffer, 0, queryGramCount);
        // the working copy
        const freqCountCopy = new Uint8Array(buffer, queryGramCount, queryGramCount);

        for (let j = 0, idx = 0; j < queryGramCount; j++) {
            const grams = query.substring(j, j + gramLen);
            const eIdx = queryGrams.get(grams);
            if (eIdx !== undefined) {
                freqCount[eIdx] += 1;
            } else {
                queryGrams.set(grams, idx);
                freqCount[idx++] = 1;
            }
        }

        const tokenScoreArr: number[][] = [];

        // compute score for each token
        for (const str of this.num2str) {
            const matches = [0];
            let intersectionSize = 0;
            freqCountCopy.set(freqCount);

            const tokenGramCount = str.length - gramLen + 1;
            for (let j = 0; j < tokenGramCount; j++) {
                const grams = str.substring(j, j + gramLen);
                const idx = queryGrams.get(grams);

                if (idx !== undefined && freqCountCopy[idx]-- > 0) {
                    intersectionSize++;
                    matches.push(j, j + gramLen);
                }
            }
            matches[0] = (2 * intersectionSize) / (queryGramCount + tokenGramCount);
            tokenScoreArr.push(matches);
        }

        // score & matches for each sentence
        const allMatches: SearchResult<T, K>[] = [];
        const scoreWindow = new Float32Array(this.maxTokenLen);
        for (let i = 0; i < this.originals.length; i++) {
            // if (!len1 && !len2) return [1, [0, 0]] as const; // if both are empty strings
            // if (!len1 || !len2) return [0, []] as const; // if only one is empty string
            // if (first === second) return [1, [0, len1]] as const; // identical
            // if (len1 === 1 && len2 === 1) return [0, []] as const; // both are 1-letter strings
            // if (len1 < 2 || len2 < 2) return [0, []] as const; // if either is a 1-letter string

            const matches = [];
            const offset = this.idxOffsets[i];

            // note: nextOffset - offset = num of words + 1
            // use the number of words as the window size in this string if maxWindow > number of words
            const tokenLen = (this.idxOffsets[i + 1] - this.idxOffsets[i]) >> 1;
            const window = Math.min(maxWindow, tokenLen);

            let score = 0,
                maxScore = 0;
            // initialize score window
            for (let j = 0; j < window; j++) {
                const values = tokenScoreArr[this.indices[offset + (j << 1)]];
                const v = values[0];
                score += scoreWindow[j] = v;

                if (v < threshold) continue;
                const temp = this.indices[offset + (j << 1) + 1];
                for (let m = 1; m < values.length; m++) {
                    matches.push(values[m] + temp);
                }
            }
            if (score > maxScore) maxScore = score;

            for (let j = window; j < tokenLen; j++) {
                // subtract the last score and add the new score
                score -= scoreWindow[j - window];
                const values = tokenScoreArr[this.indices[offset + (j << 1)]];
                const v = values[0];
                score += scoreWindow[j] = v;

                if (v < threshold) continue;
                if (score > maxScore) maxScore = score;

                const temp = this.indices[offset + (j << 1) + 1];
                for (let m = 1; m < values.length; m++) {
                    matches.push(values[m] + temp);
                }
            }

            allMatches.push({
                score: maxScore,
                matches,
                item: this.items[i],
                index: i,
                data: this.data
            });
        }

        return allMatches;
    }
}

let titleSearcher: FastSearcher<Course>;
let descriptionSearcher: FastSearcher<Course>;
let topicSearcher: FastSearcher<Section>;
let instrSearcher: FastSearcher<Section>;

function processCourseResults(results: SearchResult<Course, string>[], weight: number) {
    for (const result of results) {
        const key = result.item.key;
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

function processSectionResults(results: SearchResult<Section, string>[], weight: number) {
    for (const result of results) {
        const item = result.item;
        const key = item.key;
        const score = result.score ** 2 * weight;

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
        const query = data;

        console.time('search');
        processCourseResults(titleSearcher.sWSearch(query), 1);
        processCourseResults(descriptionSearcher.sWSearch(query), 0.5);
        processSectionResults(topicSearcher.sWSearch(query), 0.9);
        processSectionResults(instrSearcher.sWSearch(query), 0.25);
        console.timeEnd('search');
        // processCourseResults(titleSearcher.sWSearch(query, 2), 1);
        // processCourseResults(descriptionSearcher.sWSearch(query, 2), 0.5);
        // processSectionResults(topicSearcher.sWSearch(query, 2), 0.9);
        // processSectionResults(instrSearcher.sWSearch(query, 2), 0.25);

        // sort courses in descending order; section score is normalized before added to course score
        const scoreEntries = Array.from(scores)
            .sort(
                (a, b) =>
                    b[1][0] -
                    a[1][0] +
                    (b[1][2] && b[1][1] / b[1][2]) -
                    (a[1][2] && a[1][1] / a[1][2])
            )
            .slice(0, 12);
        // console.log(scoreEntries);

        const finalResults: RawAlgoCourse[] = [];
        const allMatches: SearchMatch[] = [];

        // merge course and section matches
        for (const [key] of scoreEntries) {
            const courseMatch = courseMap.get(key);
            const secMatches = new Map<number, SectionMatch[]>();

            // record section matches
            const s = sectionMap.get(key);
            if (s) for (const [id, matches] of s) secMatches.set(id, toMatches(matches));

            if (courseMatch) {
                const crsMatches: CourseMatch[] = toMatches(courseMatch);
                finalResults.push([key, courseMatch[0].item.ids]);
                allMatches.push([crsMatches, secMatches]);
            } else {
                // only section match exists
                finalResults.push([key, [...secMatches.keys()]]);
                allMatches.push([[], secMatches]);
            }
        }
        // console.log(finalResults, allMatches);
        postMessage([query, [finalResults, allMatches]]);

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
