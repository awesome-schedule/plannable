import AllRecords from '../models/AllRecords';
import Schedule from '../models/Schedule';

class ScheduleGenerator {
    /**
     *
     * @param {AllRecords} allRecords
     */
    constructor(allRecords) {
        this.allRecords = allRecords;
    }

    /**
     *
     * @param {Schedule} schedule
     * @param {Object<string, any>} filter
     */
    getSchedules(schedule, filter) {
        const courses = schedule.All;
        const results = [];

        return results;
    }
}
