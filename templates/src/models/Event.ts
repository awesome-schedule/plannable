import Course from './Course';
import { TimeDict } from '@/algorithm/ScheduleGenerator';

class Event {
    public days: string;
    public display: boolean;
    public room?: string;
    public description?: string;

    constructor(days: string, display: boolean, description?: string, room?: string) {
        this.days = days;
        this.display = display;
        this.description = description;
        this.room = room;
    }

    public hash() {
        return Course.hashCode(this.days);
    }

    public toTimeDict(): TimeDict {
        const [days, start, , end] = this.days.split(' ');
        const weekdays = ['Mo', 'Tu', 'We', 'Th', 'Fr'];
        const dict: TimeDict = {};

        const [startL, startR] = start.split(':');
        const [endL, endR] = end.split(':');

        const startMin = parseInt(startL) * 60 + parseInt(startR);
        const endMin = parseInt(endL) * 60 + parseInt(endR);

        for (const wd of weekdays) {
            if (days.indexOf(wd) !== -1) {
                dict[wd] = [startMin, endMin];
            }
        }

        return dict;
    }
}

export default Event;
