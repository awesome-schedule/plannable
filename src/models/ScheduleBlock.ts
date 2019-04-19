import Section from './Section';
import Event from './Event';

/**
 * A `ScheduleBlock` is a data structure that holds
 * all the necessary information to render a schedule on `GridSchedule`
 *
 * @see {@link GridSchedule.vue}
 */
class ScheduleBlock {
    public backgroundColor: string;
    public start: string;
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
}

export default ScheduleBlock;
