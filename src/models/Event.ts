/**
 * @module src/models
 * @author Kaiying Shan
 */

/**
 *
 */
import { TimeArray } from '../algorithm/ScheduleGenerator';
import { hashCode, hr12toInt } from '../utils';
import { Day, dayToInt } from './constants';
import Hashable from './Hashable';
import Section from './Section';

export type EventJSON = [string, number, string?, string?, string?];

/**
 * An Event is a structure different than `Course` or `Section` that can be placed on a Schedule
 *
 * It is uniquely identified by its `days` property
 */
export default class Event implements Hashable {
    public static fromJSONShort(obj: EventJSON) {
        return new Event(...obj);
    }
    public readonly key: string;
    public readonly display: boolean;
    constructor(
        public readonly days: string,
        display: boolean | number,
        public readonly title?: string,
        public readonly description?: string,
        public readonly room?: string
    ) {
        this.key = days;
        this.display = Boolean(display);
    }

    public hash() {
        return hashCode(this.days);
    }

    public copy() {
        return new Event(this.days, this.display, this.title, this.description, this.room);
    }

    public toTimeArray(): TimeArray {
        const dayArray: TimeArray = [[], [], [], [], [], [], []];
        const [days, start, , end] = this.days.split(' ');
        if (days && start && end) {
            const tStart = hr12toInt(start),
                tEnd = hr12toInt(end);
            for (let i = 0; i < days.length; i += 2)
                dayArray[dayToInt[days.substr(i, 2) as Day]].push(tStart, tEnd);
        }
        return dayArray;
    }

    public toJSONShort() {
        const obj: EventJSON = [this.days, +this.display];
        if (this.title) obj[2] = this.title;
        if (this.description) obj[3] = this.description;
        if (this.room) obj[4] = this.room;
        return obj;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public has(sec: Section) {
        return false;
    }
}
