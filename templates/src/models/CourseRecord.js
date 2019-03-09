class AllRecords {
    /**
     *
     * @param {Object<string, [number, string, number, Object<string, number>, number, number, string[][], string[], string[], string[], string[], number[], number[], number[], number[], string][]>} raw_data
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
    get(key, section = 0) {
        return new CourseRecord(this.raw_data[key], section);
    }

    /**
     *
     * @param {string} query
     * @param {number} max_result
     * @returns {CourseRecord[]}
     */
    search(query, max_results = 10) {
        query = query.trim().toLowerCase();
        const results = [];
        const exist = x => {
            return results.some(ele => ele.id === x[0]);
        };
        for (const key in this.raw_data) {
            const course = this.raw_data[key];
            if ((key.indexOf(query) !== -1 || course[9].indexOf(query) !== -1) && !exist(course)) {
                results.push(new CourseRecord(course));
                if (results.length >= max_results) break;
            }
        }
        return results;
    }
}

class CourseRecord {
    /**
     *
     * @param {[number, string, number, Object<string, number>, number, number, string[][], string[], string[], string[], string[], number[], number[], number[], number[], string]} raw
     * @param {Object<number, string>} attr_map
     */
    constructor(raw, section = 0) {
        const sid = raw[3][section];

        this.id = this[0] = raw[0];
        this.department = this[1] = raw[1];
        this.number = this[2] = raw[2];
        this.section = this[3] = section;
        this.type = this[4] = raw[4];
        this.units = this[5] = raw[5];
        this.instructor = this[6] = raw[6][sid];
        this.days = this[7] = raw[7][sid];
        this.room = this[8] = raw[8][sid];
        this.title = this[9] = raw[9][sid];
        this.topic = this[10] = raw[10][sid];
        this.status = this[11] = raw[11][sid];
        this.enrollment = this[12] = raw[12][sid];
        this.enrollment_limit = this[13] = raw[13][sid];
        this.wait_list = this[14] = raw[14][sid];
        this.description = this[15] = raw[15];

        // only used in schedule rendering
        this.color = '';
        this.start = '';
        this.end = '';
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

export default {
    CourseRecord
};

export { CourseRecord, AllRecords };
