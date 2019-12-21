import Schedule, { ScheduleJSON, ScheduleAll } from './Schedule';
import ProposedSchedule from './ProposedSchedule';
import Event from './Event';
import { RawAlgoCourse } from '../algorithm/ScheduleGenerator';

export default class GeneratedSchedule extends Schedule {
    constructor(raw: RawAlgoCourse[] = [], events: Event[] = []) {
        const tempAll: ScheduleAll = {};
        for (const [key, sections] of raw) {
            tempAll[key] = new Set(sections);
        }
        super(tempAll, events);
    }

    public update() {
        throw new Error();
    }

    public remove() {
        throw new Error();
    }

    /**
     * get a copy of this schedule
     */
    public copy(deepCopyEvent = true) {
        const AllCopy: ScheduleAll = {};
        for (const key in this.All) {
            const sections = this.All[key];
            if (sections instanceof Set) {
                AllCopy[key] = new Set(sections);
            } else {
                AllCopy[key] = sections;
            }
        }
        // note: is it desirable to deep-copy all the events?
        return new ProposedSchedule(
            AllCopy,
            deepCopyEvent ? this.events.map(e => e.copy()) : this.events
        );
    }
}
