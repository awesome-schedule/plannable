import Section from './Section';
import Event from './Event';
import { checkTimeBlockStrConflict } from './Utils';

/**
 * A `ScheduleBlock` is a data structure that holds
 * all the necessary information to render a schedule on `GridSchedule`
 *
 * @see {@link GridSchedule.vue}
 */
class ScheduleBlock {
    /**
     * background color in hex, e.g. `#ffffff`
     */
    public backgroundColor: string;
    /**
     * start time in 24hr format: `13:00`
     */
    public start: string;
    /**
     * end time in 24hr format: `15:00`
     */
    public end: string;
    public section: Section | Section[] | Event;

    constructor(
        backgroundColor: string,
        start: string,
        end: string,
        section: Section | Section[] | Event
    ) {
        this.backgroundColor = backgroundColor;
        this.start = start;
        this.end = end;
        this.section = section;
    }

    public conflict(other: ScheduleBlock, includeEnd: boolean = false) {
        return checkTimeBlockStrConflict(this.start, this.end, other.start, other.end, includeEnd);
    }
}

export default ScheduleBlock;
