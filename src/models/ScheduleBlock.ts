/**
 * @author Hanzhi Zhou
 * @see [[ScheduleBlock]]
 */

/**
 *
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
    /**
     * duration of the block, in minutes
     */
    public duration: number = 0;
    /**
     * the stuff contained in this block
     */
    public section: Section | Course | Event;
    /**
     * the left of the block relative to the column, a decimal between 0 and 1
     */
    public left = -1;
    /**
     * the width of the block relative to the column, a decimal between 0 and 1
     */
    public width = -1;
    /**
     * whether the block is highlighted
     */
    public strong = false;

    private startMin: number;
    private endMin: number;

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

        [this.startMin, this.endMin] = this.timeAsInt();
        this.duration = this.endMin - this.startMin;
    }

    /**
     * returns whether this block has conflict with another block
     * @param other
     * @param includeEnd whether to treat end-point touch as conflict
     */
    public conflict(other: ScheduleBlock, includeEnd: boolean = false) {
        return checkTimeBlockConflict(
            this.startMin,
            this.endMin,
            other.startMin,
            other.endMin,
            includeEnd
        );
    }

    public [Symbol.toPrimitive](hint: any) {
        if (hint === 'number') {
            return this.duration;
        }
        return null;
    }

    private timeAsInt(): [number, number] {
        const [a, b] = this.start.split(':');
        const [c, d] = this.end.split(':');
        return [+a * 60 + +b, +c * 60 + +d];
    }
}
