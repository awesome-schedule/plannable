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
import { SearchResult } from '@/algorithm/Searcher';

const Module = require('../algorithm/quick_example.js').default;
// console.log(Module);

export class FastSearcher2<T> {
    _searcher: any;
    constructor(items: T[], toStr: (x: T) => string = x => x as any, public data = '') {
        const sV = Module._stringVec(items.length);
        for (let i = 0; i < items.length; i++) {
            sV.set(
                i,
                toStr(items[i])
                    .trimEnd()
                    .toLowerCase()
            );
        }
        this._searcher = new Module._FastSearcher(sV);
        this.data = data;
        console.log(this, this._searcher);
    }
    sWSearch(query: string, gramLen = 3, threshold = 0.03, maxWindow = 2) {
        const t2 = query
            .trim()
            .toLowerCase()
            .split(/\s+/);
        query = t2.join(' ');
        if (query.length <= 2) return [];

        maxWindow = Math.max(maxWindow || t2.length, 2);
        const results = this._searcher.sWSearch(query, maxWindow, gramLen, threshold);
        const jsArr = [];
        for (let i = 0; i < results.size(); i++) {
            const _result = results.get(i);
            const _matches = _result.matches;
            const matches = [];
            for (let j = 0; j < _matches.size(); j++) {
                matches.push(_matches.get(j));
            }
            const result: SearchResult<T, string> = {
                score: _result.score,
                index: _result.index,
                matches,
                data: this.data
            };
            jsArr.push(result);
        }
        return jsArr;
    }
}
const FastSearcher = FastSearcher2;
type _FastSearcher<T> = FastSearcher2<T>;

type Section = Omit<SectionFields, 'course'>;
interface Course extends Omit<NonFunctionProperties<_Course>, 'sections'> {}

declare function postMessage(msg: [string, [RawAlgoCourse[], SearchMatch[]]] | 'ready'): void;

let titleSearcher: _FastSearcher<Course>;
let descriptionSearcher: _FastSearcher<Course>;
let topicSearcher: _FastSearcher<Section>;
let instrSearcher: _FastSearcher<Section>;

function processCourseResults(results: SearchResult<Course, string>[], weight: number) {
    for (const result of results) {
        const { key } = courses[result.index];
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
        const { key, id } = sections[result.index];
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

        Module.onRuntimeInitialized = () => {
            titleSearcher = new FastSearcher(courses, obj => obj.title, 'title');
            descriptionSearcher = new FastSearcher(courses, obj => obj.description, 'description');
            topicSearcher = new FastSearcher(sections, obj => obj.topic, 'topic');
            instrSearcher = new FastSearcher(
                sections,
                obj => obj.instructors.join(' '),
                'instructors'
            );
        };

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
                finalResults.push([key, courses[courseMatch[0].index].ids]);
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
