import Course from './Course';
import CourseRecord from './CourseRecord';
class AllRecords {
    /**
     *
     * @param {Object<string, [number[], string, number, number[], number, number, string[][], string[], string[], string, string[], number[], number[], number[], number[], string][]>} raw_data
     */
    constructor(raw_data) {
        this.raw_data = raw_data;
    }

    /**
     * Get a CourseRecord associated with the given key
     * @param {string} key
     * @param {number} section
     * @returns {CourseRecord}
     */
    getRecord(key) {
        return new CourseRecord(this.raw_data[key], key);
    }

    /**
     * Get a Course associated with the given key and section
     * @param {string} key
     * @param {number} section
     * @returns {Course}
     */
    getCourse(key, section = 0) {
        return new Course(this.raw_data[key], key, section);
    }

    /**
     *
     * @param {string} query
     * @param {number} max_result
     * @returns {CourseRecord[]}
     */
    search(query, max_results = 5) {
        console.time('query');
        query = query.trim().toLowerCase();
        // query no space
        const query_no_sp = query.split(' ').join('');
        const matches = [[], [], [], []];
        for (const key in this.raw_data) {
            const course = this.raw_data[key];

            // match with the course number
            if (key.indexOf(query_no_sp) !== -1) {
                matches[0].push(new CourseRecord(course, key));

                // match with the title
            } else if (course[9].toLowerCase().indexOf(query) !== -1) {
                matches[1].push(new CourseRecord(course, key));
            } else {
                // check any topic match. Select the sections which only match the topic
                const matchIdx = [];
                for (let i = 0; i < course[3].length; i++) {
                    const topic = course[10][i];
                    if (topic.toLowerCase().indexOf(query) !== -1) matchIdx.push(i);
                }
                // match the course topics
                if (matchIdx.length > 0) {
                    matches[2].push(new CourseRecord(course, key));

                    // lastly, check description match
                } else if (course[15].toLowerCase().indexOf(query) !== -1) {
                    matches[3].push(new CourseRecord(course, key));
                }
            }
            if (matches[0].length >= max_results) break;
        }

        let len = 0;
        let indices = [];
        for (let i = 0; i < matches.length; i++) {
            indices.push(Math.min(matches[i].length, max_results - len));
            len += matches[i].length;
            if (len >= max_results) break;
        }
        let results = [];
        for (const [i, upper] of indices.entries())
            results = results.concat(matches[i].slice(0, upper));
        console.timeEnd('query');
        return results;
    }
}

export default AllRecords;
