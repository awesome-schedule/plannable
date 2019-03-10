class AllRecords {
    /**
     *
     * @param {Object<string, [number[], string, number, number[], number, number, string[][], string[], string[], string, string[], number[], number[], number[], number[], string][]>} raw_data
     */
    constructor(raw_data) {
        this.raw_data = raw_data;
    }
    /**
     *
     * @param {string} key
     * @param {number} section
     * @returns {CourseRecord}
     */
    getRecord(key) {
        return new CourseRecord(this.raw_data[key], key);
    }

    getCourse(key, section = 0) {
        return new Course(this.raw_data[key], section);
    }

    /**
     *
     * @param {string} query
     * @param {number} max_result
     * @returns {CourseRecord[]}
     */
    search(query, max_results = 5) {
        // console.time('asd');
        query = query.trim().toLowerCase();
        const results = [];
        for (const key in this.raw_data) {
            const course = this.raw_data[key];

            if (key.indexOf(query) !== -1) {
                results.push([new CourseRecord(course, key), 0]);
            } else if (course[9].toLowerCase().indexOf(query) !== -1) {
                results.push([new CourseRecord(course, key), 1]);
            } else {
                const matchIdx = [];
                for (let i = 0; i < course[3].length; i++) {
                    const topic = course[10][i];
                    if (topic.toLowerCase().indexOf(query) !== -1) matchIdx.push(i);
                }
                if (matchIdx.length > 0) {
                    results.push([new CourseRecord(course, key, matchIdx), 2]);
                } else if (course[15].toLowerCase().indexOf(query) !== -1) {
                    results.push([new CourseRecord(course, key), 3]);
                }
            }
            // if (results.length >= max_results) break;
        }

        // console.log(results.length);
        const res = results
            .sort((a, b) => {
                if (a[1] < b[1]) return -1;
                else if (a[1] > b[1]) return 1;
                return 0;
            })
            .slice(0, max_results)
            .map(x => x[0]);
        // console.timeEnd('asd');
        return res;
    }
}

class CourseRecord {
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

    static LIST = [0, 3, 6, 7, 8, 10, 11, 12, 13, 14, 15];

    /**
     *
     * @param {[number[], string, number, number[], number, number, string[][], string[], string[], string, string[], number[], number[], number[], number[], string]} raw
     * @param {string} key
     * @param {Object<number, string>} attr_map
     */
    constructor(raw, key, sids = null) {
        // const sid = raw[3][section];
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

        if (sids != null && sids.length > 0) {
            for (const i of CourseRecord.LIST) {
                const field = CourseRecord.FIELDS[i];
                this[field] = this[i] = [];
                for (const idx of sids) {
                    this[field].push(raw[i][idx]);
                }
            }
        }
    }

    getCourse(section) {
        return new Course(this, this.key, section);
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
        const sid = section;
        this.key = key;
        this.id = this[0] = raw[0][sid];
        this.department = this[1] = raw[1];
        this.number = this[2] = raw[2];
        this.section = this[3] = section;
        this.type = this[4] = CourseRecord.TYPES[raw[4]];
        this.units = this[5] = raw[5];
        this.instructor = this[6] = raw[6][sid];
        this.days = this[7] = raw[7][sid];
        this.room = this[8] = raw[8][sid];
        this.title = this[9] = raw[9];
        this.topic = this[10] = raw[10][sid];
        this.status = this[11] = CourseRecord.TYPES[raw[11][sid]];
        this.enrollment = this[12] = raw[12][sid];
        this.enrollment_limit = this[13] = raw[13][sid];
        this.wait_list = this[14] = raw[14][sid];
        this.description = this[15] = raw[15];

        // only used in schedule rendering
        this.color = '';
        this.start = '';
        this.end = '';
    }
}

export default {
    CourseRecord
};

export { CourseRecord, AllRecords, Course };
