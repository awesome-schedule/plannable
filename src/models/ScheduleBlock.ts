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
    public pathDepth = 0;
    public depth = 0;

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
        const [a, b] = this.start.split(':');
        const [c, d] = this.end.split(':');
        const [e, f] = other.start.split(':');
        const [g, h] = other.end.split(':');
        return checkTimeBlockConflict(
            +a * 60 + +b,
            +c * 60 + +d,
            +e * 60 + +f,
            +g * 60 + +h,
            includeEnd
        );
    }
}

export default ScheduleBlock;
