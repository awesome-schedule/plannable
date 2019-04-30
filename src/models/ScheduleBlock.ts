import Section from './Section';
import Event from './Event';
import { checkTimeBlockConflict } from './Utils';

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
    public left = -1;
    public width = -1;

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
        const [a, b] = this.timeAsInt();
        const [c, d] = other.timeAsInt();
        return checkTimeBlockConflict(a, b, c, d, includeEnd);
    }

    public timeAsInt(): [number, number] {
        const [a, b] = this.start.split(':');
        const [c, d] = this.end.split(':');
        return [+a * 60 + +b, +c * 60 + +d];
    }

    public duration() {
        const [a, b] = this.timeAsInt();
        return b - a;
    }
}

export default ScheduleBlock;
