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
     * duration of the block, in minutes
     */
    public readonly duration: number;

    // ----- the following fields are only used to compute the left and width of this block -------
    // ----- they are not used when rendering
    /** an unique index for this scheduleBlock */
    public idx = 0;
    /** depth/room assignment obtained from the interval scheduling algorithm */
    public depth = 0;
    /**
     * the maximum depth (number of rooms) that the current block is on
     * also equal to the maximum depth of the block on the right hand side of this block that also conflicts with this blocks
     */
    public pathDepth = 0;
    /** visited flag used in BFS/DFS */
    public visited = false;
    /** whether this block is movable/expandable (i.e. whether there's still room for it to change its left and width) */
    public isFixed = false;
    /** a variable corresponding to +left, used in LP formulation. name will be assignment based on idx later  */
    public readonly lpLPos = { name: '', coef: 1.0 };
    /** a variable corresponding to -left, used in LP formulation. name will be assignment based on idx later  */
    public readonly lpLNeg = { name: '', coef: -1.0 };
    /** all blocks that conflict with this block */
    public readonly neighbors: ScheduleBlock[] = [];
    // --------------------------------------------------------------------------------------------

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
     * @param tolerance tolerance for overlap. If the overlap area is greater than this parameter, then 2 schedule blocks are considered to be conflict
     * Notable examples:
     * - tolerance of 0 means end point touch **is not** considered as a conflict
     * - tolerance of -1 or lower means end point touch **is** not considered as a conflict
     */
    public conflict(other: ScheduleBlock, tolerance = 0) {
        return calcOverlap(this.startMin, this.endMin, other.startMin, other.endMin) > tolerance;
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
