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
        const matches = [[], [], [], []];
        for (const key in this.raw_data) {
            const course = this.raw_data[key];

            // match with the course number
            if (key.indexOf(query) !== -1) {
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

class CourseRecord {
    /**
     * lecture type number => meaning
     */
    static TYPES = {
        0: 'Clinical',
        1: 'Discussion',
        2: 'Drill',
        3: 'Independent Study',
        4: 'Laboratory',
        5: 'Lecture',
        6: 'Practicum',
        7: 'Seminar',
        8: 'Studio',
        9: 'Workshop'
    };

    /**
     * status number => meaning
     */
    static STATUSES = {
        1: 'Open',
        0: 'Closed',
        2: 'Wait List'
    };

    static FIELDS = {
        0: 'id',
        1: 'department',
        2: 'number',
        3: 'section',
        4: 'type',
        5: 'units',
        6: 'instructor',
        7: 'days',
        8: 'room',
        9: 'title',
        10: 'topic',
        11: 'status',
        12: 'enrollment',
        13: 'enrollment_limit',
        14: 'wait_list',
        15: 'description'
    };

    /**
     * The list of indices at which the field is a list
     */
    static LIST = [0, 3, 6, 7, 8, 10, 11, 12, 13, 14, 15];

    /**
     *
     * @param {[number[], string, number, number[], number, number, string[][], string[], string[], string, string[], number[], number[], number[], number[], string]} raw
     * @param {string} key
     * @param {number[]} sid A list of section indices
     */
    constructor(raw, key, sids = null) {
        this.key = key;

        this.id = this[0] = raw[0];
        this.department = this[1] = raw[1];
        this.number = this[2] = raw[2];
        this.section = this[3] = raw[3];
        this.type = this[4] = CourseRecord.TYPES[raw[4]];
        this.units = this[5] = raw[5];
        this.instructor = this[6] = raw[6];
        this.days = this[7] = raw[7];
        this.room = this[8] = raw[8];
        this.title = this[9] = raw[9];
        this.topic = this[10] = raw[10];
        this.status = this[11] = raw[11].map(status => CourseRecord.STATUSES[status]);
        this.enrollment = this[12] = raw[12];
        this.enrollment_limit = this[13] = raw[13];
        this.wait_list = this[14] = raw[14];
        this.description = this[15] = raw[15];

        if (sids !== null && sids.length > 0) {
            for (const i of CourseRecord.LIST) {
                const field = CourseRecord.FIELDS[i];
                this[field] = this[i] = [];
                for (const idx of sids) {
                    this[field].push(raw[i][idx]);
                }
            }
        }
    }

    /**
     * Get the course of a given section
     * @param {number} section
     * @return {Course}
     */
    getCourse(section) {
        return new Course(this, this.key, section);
    }

    /**
     * Get the CourseRecord at a given range of sections
     * @param {number[]} sections
     * @return {CourseRecord}
     */
    getRecord(sections) {
        return new CourseRecord(this, this.key, sections);
    }

    /**
     * @param {Object} object
     */
    equals(object) {
        if (object instanceof CourseRecord) {
            return this.id == object.id;
        } else {
            return this.id == object[0];
        }
    }
}

class Course {
    /**
     * @param {[number[], string, number, number[], number, number, string[][], string[], string[], string, string[], number[], number[], number[], number[], string]} raw
     * @param {string} key
     * @param {number} section
     */
    constructor(raw, key, section = 0) {
        this.raw = raw;
        const sid = section;
        this.sid = sid;
        this.key = key;
        this.id = this[0] = raw[0][sid];
        this.department = this[1] = raw[1];
        this.number = this[2] = raw[2];
        this.section = this[3] = raw[3][sid];
        this.type = this[4] = isNaN(+raw[4]) ? raw[4] : CourseRecord.TYPES[raw[4]];
        this.units = this[5] = raw[5];
        this.instructor = this[6] = raw[6][sid];
        this.days = this[7] = raw[7][sid];
        this.room = this[8] = raw[8][sid];
        this.title = this[9] = raw[9];
        this.topic = this[10] = raw[10][sid];
        this.status = this[11] = isNaN(+raw[11][sid])
            ? raw[11][sid]
            : CourseRecord.TYPES[raw[11][sid]];
        this.enrollment = this[12] = raw[12][sid];
        this.enrollment_limit = this[13] = raw[13][sid];
        this.wait_list = this[14] = raw[14][sid];
        this.description = this[15] = raw[15];

        // only used in schedule rendering
        this.color = 1;
        this.start = '';
        this.end = '';

        //
        this.default = true;
    }

    /**
     * get a copy of Course
     * @return {Course}
     */
    copy() {
        const cp = new Course(this.raw, this.key, this.sid);
        cp.color = this.color;
        cp.start = this.start;
        cp.end = this.end;
        cp.default = this.default;
        return cp;
    }
}

export { CourseRecord, AllRecords, Course };
