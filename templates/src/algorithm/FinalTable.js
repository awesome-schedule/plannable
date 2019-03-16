import Schedule from '../models/Schedule';
class FinalTable {
    constructor() {
        this.finalTable = new Array();
    }

    /**
     *
     * @param {[string,string[],number[],number]} timeTable
     */
    add(timeTable) {
        const schedule = new Schedule(timeTable);
        this.finalTable.push(schedule);
    }
}
export { FinalTable };
