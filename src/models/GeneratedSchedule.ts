import Schedule, { ScheduleAll } from './Schedule';
import ProposedSchedule from './ProposedSchedule';
import Event from './Event';
import { RawAlgoCourse } from '../algorithm/ScheduleGenerator';

export default class GeneratedSchedule extends Schedule {
    constructor(raw: RawAlgoCourse[] = [], events: Event[] = []) {
        const tempAll: ScheduleAll = {};
        for (const [key, sections] of raw) {
            const secs = tempAll[key] as Set<number>[];
            if (secs) {
                secs.push(new Set(sections));
            } else {
                tempAll[key] = [new Set(sections)];
            }
        }
        super(tempAll, events);
    }

    public update() {
        throw new Error();
    }

    public remove() {
        throw new Error();
    }

    public copy(): ProposedSchedule {
        throw new Error();
    }
}
