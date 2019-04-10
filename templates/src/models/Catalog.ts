import Section from './Section';
import Course from './Course';
import { RawCatalog } from './Meta';

export interface Semester {
    id: string;
    name: string;
}

class Catalog {
    /**
     * Parse AllRecords from parsed JSON
     * @returns `null` if data is invalid
     */
    public static fromJSON(
        data: { modified: string; semester: Semester; raw_data: RawCatalog },
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
            if (now - dataTime > expTime)
                return {
                    catalog: new Catalog(data.semester, data.raw_data),
                    expired: true
                };
            else {
                return {
                    catalog: new Catalog(data.semester, data.raw_data),
                    expired: false
                };
            }
        }
        return null;
    }
    public semester: Semester;
    public raw_data: RawCatalog;

    constructor(semester: Semester, raw_data: RawCatalog) {
        this.semester = semester;
        this.raw_data = raw_data;
    }

    public fromJSON(
        data: { modified: string; semester: Semester; raw_data: RawCatalog },
        expTime = 2 * 3600 * 1000
    ) {
        return Catalog.fromJSON(data, expTime);
    }

    public toJSON() {
        return {
            semester: this.semester,
            raw_data: this.raw_data,
            modified: new Date().toJSON()
        };
    }

    /**
     * Get a Course associated with the given key
     *
     * you may specify a set of section indices so that you can
     * only obtain a subset of the original course sections
     */
    public getCourse(key: string, sections?: Set<number> | -1) {
        if (!sections) return new Course(this.raw_data[key], key);
        else if (sections === -1) return new Course(this.raw_data[key], key);
        else return new Course(this.raw_data[key], key, [...sections.values()]);
    }

    /**
     * Get a Course associated with the given key and section index
     */
    public getSection(key: string, section = 0) {
        return new Course(this.raw_data[key], key).getSection(section);
    }

    public search(query: string, max_results = 10) {
        console.time('query');
        query = query.trim().toLowerCase();
        // query no space
        const query_no_sp = query.split(' ').join('');
        const matches: Course[][] = [[], [], [], [], []];
        for (const key in this.raw_data) {
            const course = this.raw_data[key];

            // match with the course number
            if (key.indexOf(query_no_sp) !== -1) {
                matches[0].push(new Course(course, key));

                // match with the title
            } else if (course[4].toLowerCase().indexOf(query) !== -1) {
                matches[1].push(new Course(course, key));
            } else {
                // check any topic/professor match. Select the sections which only match the topic/professor
                const topicMatchIdx = [];
                const profMatchIdx = [];

                for (let i = 0; i < course[6].length; i++) {
                    const section = course[6][i];
                    const topic = section[2];
                    if (topic.toLowerCase().indexOf(query) !== -1) {
                        topicMatchIdx.push(i);
                        continue;
                    }
                    const meetings = section[7];
                    for (const meeting of meetings) {
                        // TODO: better prof name match
                        if (meeting[0].toLowerCase().indexOf(query) !== -1) {
                            profMatchIdx.push(i);
                            break;
                        }
                    }
                }
                if (topicMatchIdx.length > 0) {
                    matches[2].push(new Course(course, key, topicMatchIdx));
                } else if (profMatchIdx.length > 0) {
                    matches[4].push(new Course(course, key, profMatchIdx));
                    // lastly, check description match
                } else if (course[5].toLowerCase().indexOf(query) !== -1) {
                    matches[3].push(new Course(course, key));
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
        let results: Course[] = [];
        for (const [i, upper] of indices.entries())
            results = results.concat(matches[i].slice(0, upper));
        console.timeEnd('query');
        return results;
    }
}

export default Catalog;
