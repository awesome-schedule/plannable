import Course from './Course';
import * as Utils from './Utils';
import { TimeDict } from '../algorithm/ScheduleGenerator';

class Event {
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
        this.days = days;
        this.display = display;
        this.title = title;
        this.description = description;
        this.room = room;
    }

    public hash() {
        return Course.hashCode(this.days);
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
