import * as Utils from './Utils';
import { TimeDict } from '../algorithm/ScheduleGenerator';
import Hashable from './Hashable';

/**
 * An Event is a structure different than `Course` or `Section` that can be placed on a Schedule
 *
 * It is uniquely identified by its `days` property
 */
class Event implements Hashable {
    public key: string;
    public days: string;
    public display: boolean;
    public title?: string;
    public room?: string;
    public description?: string;

    constructor(
        days: string,
        display: boolean,
        title?: string,
        description?: string,
        room?: string
    ) {
        this.key = this.days = days;
        this.display = display;
        this.title = title;
        this.description = description;
        this.room = room;
    }

    public hash() {
        return Utils.hashCode(this.days);
    }

    public copy() {
        return new Event(this.days, this.display, this.title, this.description, this.room);
    }

    public toTimeDict(): TimeDict {
        const dict: TimeDict = {};

        const [date, timeBlock] = Utils.parseTimeAll(this.days) as [string[], number[]];
        for (const day of date) {
            dict[day] = timeBlock;
        }

        return dict;
    }
}

export default Event;
