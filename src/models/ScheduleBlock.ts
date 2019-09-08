/**
 * @author Hanzhi Zhou
 * @module models
 */

/**
 *
 */
import { calcOverlap, hr24toInt } from '../utils';
import Course from './Course';
import Event from './Event';
import Section from './Section';

/**
 * A `ScheduleBlock` is a data structure that holds
 * all the necessary information to render a schedule on `GridSchedule`
 *
 * @see [[GridSchedule]]
 */
export default class ScheduleBlock {
    /**
     * duration of the block, in minutes
     */
    public readonly duration: number;
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

    private readonly startMin: number;
    private readonly endMin: number;

    /**
     * @param backgroundColor background color in hex, e.g. `#ffffff`
     * @param start start time in 24hr format: `13:00`
     * @param end end time in 24hr format: `15:00`
     * @param section the stuff contained in this block
     */
    constructor(
        public readonly backgroundColor: string,
        public readonly start: string,
        public readonly end: string,
        public readonly section: Section | Course | Event
    ) {
        this.startMin = hr24toInt(start);
        this.endMin = hr24toInt(end);
        this.duration = this.endMin - this.startMin;
    }

    /**
     * returns whether this block has conflict with another block
     * @param other
     * @param includeEnd whether to treat end-point touch as conflict
     */
    public conflict(other: ScheduleBlock, includeEnd = false) {
        const olap = calcOverlap(this.startMin, this.endMin, other.startMin, other.endMin);
        if (includeEnd) {
            return olap >= 0;
        } else {
            return olap > 0;
        }
    }
}
