import { Searcher, SearchResult } from 'fast-fuzzy';
import Course from '../models/Course';
import Section, { SectionMatch } from '../models/Section';

declare var postMessage: any;

let courseSearcher: Searcher<Course>;
let sectionSearcher: Searcher<Section>;
let count = 0;

function addSectionMatches(course: Course, sids: number[], secMatches: SectionMatch[][]) {
    sids = sids.filter((sid, idx) => {
        const exIdx = course.sids.findIndex(s => s === sid);
        if (exIdx === -1) return true;
        else {
            course.sections[exIdx].matches.push(...secMatches[idx]);
            (secMatches[idx] as any) = null;
            return false;
        }
    });
    secMatches = secMatches.filter(x => x);
    course.sections.push(...sids.map((i, idx) => new Section(course, i, secMatches[idx])));
    course.sections.sort((a, b) => a.sid - b.sid);
    course.sids.push(...sids);
    course.sids.sort();
}

onmessage = (msg: MessageEvent) => {
    if (count === 0) {
        console.time('worker prep');
        const { courses } = msg.data;
        const sections: Section[] = [];
        for (const { sections: secs } of courses) sections.push(...secs);

        sectionSearcher = new Searcher(sections, {
            returnMatchData: true,
            ignoreCase: true,
            normalizeWhitespace: true,
            keySelector: obj => [obj.topic, obj.instructors.join(', ')]
        });
        courseSearcher = new Searcher(courses, {
            returnMatchData: true,
            ignoreCase: true,
            normalizeWhitespace: true,
            keySelector: obj => [obj.title, obj.description]
        });
        console.timeEnd('worker prep');
    } else {
        const query = msg.data;

        console.time('search');
        const courseResults = courseSearcher.search(query);
        const sectionResults = sectionSearcher.search(query);
        console.timeEnd('search');

        const courseScores: { [x: string]: number } = Object.create(null);
        const courseMap: { [x: string]: SearchResult<Course> } = Object.create(null);
        const sectionMap: { [x: string]: SearchResult<Section>[] } = Object.create(null);

        for (const result of courseResults) {
            const key = result.item.key;
            courseScores[key] = result.score;
            courseMap[key] = result;
        }

        for (const result of sectionResults) {
            const key = result.item.key;
            if (courseScores[key]) {
                courseScores[key] += result.score;
            } else {
                courseScores[key] = result.score;
            }
            if (sectionMap[key]) {
                sectionMap[key].push(result);
            } else {
                sectionMap[key] = [result];
            }
        }

        const scoreEntries = Object.entries(courseScores)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 12);

        const finalResults: Course[] = [];
        for (const [key] of scoreEntries) {
            const courseMatch = courseMap[key];
            let course: Course;
            if (courseMatch) {
                course = courseMatch.item;
                const { match, original } = courseMatch;
                course.matches.push({
                    match: original === course.title ? 'title' : 'description',
                    start: match.index,
                    end: match.index + match.length
                });
                const s = sectionMap[key];
                if (s) {
                    addSectionMatches(
                        course,
                        s.map(x => x.item.sid),
                        s.map(x => [
                            {
                                match: x.original === x.item.topic ? 'topic' : 'instructors',
                                start: x.match.index,
                                end: x.match.index + x.match.length
                            } as SectionMatch
                        ])
                    );
                }
            } else {
                const s = sectionMap[key];
                course = new Course(
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
                );
            }
            finalResults.push(course);
        }
        postMessage(
            finalResults.map(c => {
                const matches = c.matches.concat();
                c.matches.length = 0;
                return [
                    c.raw,
                    c.key,
                    c.sids,
                    matches,
                    c.sections.map(x => {
                        const ms = x.matches.concat();
                        x.matches.length = 0;
                        return ms;
                    })
                ];
            })
        );
    }
    count++;
};
