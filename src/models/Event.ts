/**
 * @module models
 * @author Kaiying Shan
 */

/**
 *
 */
import { hashCode, parseTimeAsTimeArray } from '../utils';
import { TimeArray } from '../algorithm';
import Hashable from './Hashable';

/**
 * An Event is a structure different than `Course` or `Section` that can be placed on a Schedule
 *
 * It is uniquely identified by its `days` property
 */
export default class Event implements Hashable {
    public key: string;

    constructor(
        public days: string,
        public display: boolean,
        public title?: string,
        public description?: string,
        public room?: string
    ) {
        this.key = days;
    }

    public hash() {
        return hashCode(this.days);
    }

    public copy() {
        return new Event(this.days, this.display, this.title, this.description, this.room);
    }

    public toTimeArray(): TimeArray {
        return parseTimeAsTimeArray(this.days)!;
    }
}
