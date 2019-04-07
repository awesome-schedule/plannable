import Course from './Course';
import { TimeDict } from '@/algorithm/ScheduleGenerator';


class Event {
    public days: string;
    public room?: string;
    public description?: string;

    constructor(days: string, description?: string, room?: string){
        this.days = days;
        this.description = description;
        this.room = room;
    }

    public hash(){
        return Course.hashCode(this.days);
    }

    public toTimeDict(): TimeDict{
        return {};
    }
}

export default Event;
