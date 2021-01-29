/**
 * @author Hanzhi Zhou
 * @module src/models
 */

/**
 *
 */

import { calcOverlap } from '../utils';
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
     * the left of the block relative to the column, a decimal between 0 and 1
     */
    public left = -1.0;
    /**
     * the width of the block relative to the column, a decimal between 0 and 1
     */
    public width = -1.0;
    /**
     * duration of the block, in minutes
     */
    public idx = 0;
    public readonly duration: number;
    public depth = 0;
    public pathDepth = 0;
    /**
     * whether the block is highlighted
     */
    public strong = false;
    public visited = false;
    public isFixed = false;
    public hidden = false;

    public readonly neighbors: ScheduleBlock[] = [];

    /**
     * @param background background color in hex, e.g. `#ffffff`
     * @param section the stuff contained in this block
     * @param startMin start time of this block, in minutes from 00:00
     * @param endMin end time of this block, in minutes from 00:00
     */
    constructor(
        public readonly background: string,
        public readonly section: Section | Course | Event,
        public readonly startMin: number,
        public readonly endMin: number
    ) {
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

    // get left() {
    //     return this.getFloat32(0, true);
    // }
    // set left(val: number) {
    //     this.setFloat32(0, val, true);
    // }
    // get width() {
    //     return this.getFloat32(4, true);
    // }
    // set width(val: number) {
    //     this.setFloat32(4, val, true);
    // }
    // get startMin() {
    //     return this.getUint16(8, true);
    // }
    // set startMin(val: number) {
    //     this.setUint16(8, val, true);
    // }
    // get endMin() {
    //     return this.getUint16(10, true);
    // }
    // set endMin(val: number) {
    //     this.setUint16(10, val, true);
    // }
    // get duration() {
    //     return this.getUint16(12, true);
    // }
    // set duration(val: number) {
    //     this.setUint16(12, val, true);
    // }
    // get depth() {
    //     return this.getUint16(14, true);
    // }
    // set depth(val: number) {
    //     this.setUint16(14, val, true);
    // }
    // get pathDepth() {
    //     return this.getUint16(16, true);
    // }
    // set pathDepth(val: number) {
    //     this.setUint16(16, val, true);
    // }
}
