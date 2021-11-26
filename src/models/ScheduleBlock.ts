/**
 * @author Hanzhi Zhou
 * @module src/models
 */

/**
 *
 */
import { MeetingDate } from '@/algorithm/ScheduleGenerator';
import Course from './Course';
import Event from './Event';
import Meeting from './Meeting';
import Section from './Section';

/**
 * A `ScheduleBlock` is a data structure that holds
 * all the necessary information to render a schedule on `GridSchedule`
 *
 * @see [[GridSchedule]]
 */
export default class ScheduleBlock {
    /**
     * the relative distance of the block to the column's left border, a decimal between 0 and 1
     */
    public left = -1.0;
    /**
     * the width of the block relative to the column width, a decimal between 0 and 1
     */
    public width = -1.0;
    /**
     * whether the block is highlighted
     */
    public strong = false;

    /**
     * @param background background color in hex, e.g. `#ffffff`
     * @param section the stuff contained in this block
     * @param startMin start time of this block, in minutes from 00:00
     * @param endMin end time of this block, in minutes from 00:00
     * @param meeting if `section` is a Course/Section, this is an instance of [[Meeting]], otherwise undefined
     * @param dateArray if `section` is a Course/Section, this is an instance of [[MeetingDate]], otherwise is undefined
     * @note dateArray currently is only used in compareView as it needs the date information to properly use date separators
     */
    constructor(
        public readonly background: string,
        public readonly startMin: number,
        public readonly endMin: number,
        public readonly section: Section | Course | Event,
        public readonly meeting?: Meeting,
        public readonly dateArray?: MeetingDate
    ) {}
}
