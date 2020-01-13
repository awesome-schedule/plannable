/**
 * @module models
 * @author Kaiying Shan, Hanzhi Zhou
 */

/**
 *
 */
import Schedule, { ScheduleAll } from './Schedule';
import Event from './Event';
import ProposedSchedule from './ProposedSchedule';
import { RawAlgoCourse } from '../algorithm/ScheduleGenerator';
import { GeneratedError } from '../utils/other';

const generatedMsg =
    'You are editing a generated schedule, please edit the proposed schedule instead. If you want to keep this particular generated schedule, click "copy" to do so.';

export default class GeneratedSchedule extends Schedule {
    /**
     * A generated schedule's All can never contain -1 (Any Section)
     */
    public All: ScheduleAll<Set<number>[]>;

    constructor(raw: RawAlgoCourse[] = [], events: Event[] = []) {
        const tempAll: GeneratedSchedule['All'] = {};
        for (const [key, sections] of raw) {
            const secs = tempAll[key];
            if (secs) {
                secs.push(new Set(sections));
            } else {
                tempAll[key] = [new Set(sections)];
            }
        }
        super(tempAll, events);
        this.All = tempAll;
    }

    public update() {
        throw new GeneratedError(generatedMsg);
    }

    public remove() {
        throw new GeneratedError(generatedMsg);
    }

    public copy(deepCopyEvent = true): ProposedSchedule {
        const AllCopy = this._copy();
        // note: is it desirable to deep-copy all the events?
        return new ProposedSchedule(
            AllCopy,
            deepCopyEvent ? this.events.map(e => e.copy()) : this.events
        );
    }
}
