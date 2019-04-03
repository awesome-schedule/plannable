import Course from './Course';
import CourseRecord from './CourseRecord';

export type RawRecord = [
    number[],
    string,
    number,
    number[],
    number,
    number,
    string[][],
    string[],
    string[],
    string,
    string[],
    number[],
    number[],
    number[],
    number[],
    string
];

export interface Semester {
    id: string;
    name: string;
}

class AllRecords {
    /**
     * Parse AllRecords from parsed JSON
     * return `null` if data is invalid or data expired
     * @param {{modified: string, semester: Semester, raw_data: Object<string, RawRecord>}} data
     */
    public static fromJSON(
        data: { modified: string; semester: Semester; raw_data: { [x: string]: RawRecord } },
        expTime = 2 * 3600 * 1000
    ) {
        if (
            data &&
            typeof data.modified === 'string' &&
            data.semester instanceof Object &&
            data.raw_data instanceof Object
        ) {
            const now = new Date().getTime();
            const dataTime = new Date(data.modified).getTime();
            if (now - dataTime > expTime) return null;
            else {
                return new AllRecords(data.semester, data.raw_data);
            }
        }
        return undefined;
    }
    public semester: Semester;
    public raw_data: { [s: string]: RawRecord };

    constructor(semester: Semester, raw_data: { [s: string]: RawRecord }) {
        this.semester = semester;
        this.raw_data = raw_data;
    }

    public fromJSON(
        data: { modified: string; semester: Semester; raw_data: { [x: string]: RawRecord } },
        expTime = 2 * 3600 * 1000
    ) {
        return AllRecords.fromJSON(data, expTime);
    }

    public toJSON() {
        return {
            semester: this.semester,
            raw_data: this.raw_data,
            modified: new Date().toJSON()
        };
    }

    /**
     * Get a CourseRecord associated with the given key
     */
    public getRecord(key: string, sections?: Set<number> | -1) {
        if (!sections) return new CourseRecord(this.raw_data[key], key);
        else if (sections === -1) return new CourseRecord(this.raw_data[key], key);
        else return new CourseRecord(this.raw_data[key], key, [...sections.values()]);
    }

    /**
     * Get a Course associated with the given key and section index
     */
    public getCourse(key: string, section = 0) {
        return new Course(this.raw_data[key], key, section);
    }

    public search(query: string, max_results = 10) {
        console.time('query');
        query = query.trim().toLowerCase();
        // query no space
        const query_no_sp = query.split(' ').join('');
        const matches: CourseRecord[][] = [[], [], [], [], []];
        for (const key in this.raw_data) {
            const course = this.raw_data[key];

            // match with the course number
            if (key.indexOf(query_no_sp) !== -1) {
                matches[0].push(new CourseRecord(course, key));

                // match with the title
            } else if (course[9].toLowerCase().indexOf(query) !== -1) {
                matches[1].push(new CourseRecord(course, key));
            } else {
                // check any topic/professor match. Select the sections which only match the topic/professor
                const topicMatchIdx = [];
                const profMatchIdx = [];

                for (let i = 0; i < course[3].length; i++) {
                    const topic = course[10][i];
                    if (topic.toLowerCase().indexOf(query) !== -1) {
                        topicMatchIdx.push(i);
                        continue;
                    }
                    const profs = course[6][i];
                    for (const prof of profs) {
                        // TODO: better prof name match
                        if (prof.toLowerCase().indexOf(query) !== -1) {
                            profMatchIdx.push(i);
                            break;
                        }
                    }
                }
                if (topicMatchIdx.length > 0) {
                    matches[2].push(new CourseRecord(course, key, topicMatchIdx));
                } else if (profMatchIdx.length > 0) {
                    matches[4].push(new CourseRecord(course, key, profMatchIdx));
                    // lastly, check description match
                } else if (course[15].toLowerCase().indexOf(query) !== -1) {
                    matches[3].push(new CourseRecord(course, key));
                }
            }
            if (matches[0].length >= max_results) break;
        }

        let len = 0;
        const indices = [];
        for (let i = 0; i < matches.length; i++) {
            indices.push(Math.min(matches[i].length, max_results - len));
            len += matches[i].length;
            if (len >= max_results) break;
        }
        let results: CourseRecord[] = [];
        for (const [i, upper] of indices.entries())
            results = results.concat(matches[i].slice(0, upper));
        console.timeEnd('query');
        return results;
    }
}

export default AllRecords;
