/**
 * @author Hanzhi Zhou
 * @see [[ScheduleBlock]]
 */
import Section from './Section';
import Event from './Event';
import { checkTimeBlockConflict } from '../utils';
import Course from './Course';

/**
 * A `ScheduleBlock` is a data structure that holds
 * all the necessary information to render a schedule on `GridSchedule`
 *
 * @see [[GridSchedule]]
 */
export default class ScheduleBlock {
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
    public duration: number = 0;
    public section: Section | Course | Event;
    public left = -1;
    public width = -1;
    public strong = false;

    constructor(
        backgroundColor: string,
        start: string,
        end: string,
        section: Section | Course | Event
    ) {
        this.backgroundColor = backgroundColor;
        this.start = start;
        this.end = end;
        this.section = section;

        const [a, b] = this.timeAsInt();
        this.duration = b - a;
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

    [Symbol.toPrimitive](hint: any) {
        if (hint === 'number') {
            return this.duration;
        }
        return null;
    }
}
