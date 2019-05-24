/**
 * the component for customizing colors of classes and events
 *
 * @author Hanzhi Zhou
 */

/**
 *
 */
import { Vue, Component } from 'vue-property-decorator';
import Schedule from '../models/Schedule';
import Store from '../store';

@Component
export default class Palette extends Store {
    /**
     * get the number of events and courses that have colors in total
     */
    numColors() {
        return (
            this.palette.colorEntries.length +
            this.schedule.currentSchedule.colorSlots.reduce((acc, x) => x.size + acc, 0)
        );
    }
    /**
     * @note colors must always be recomputed because `Schedule.savedColors` is not a reactive property
     */
    courseColors() {
        return this.palette.colorEntries
            .concat(
                this.schedule.currentSchedule.colorSlots.reduce(
                    (arr: Array<[string, string]>, bucket, i) =>
                        arr.concat(
                            [...bucket.values()].map(
                                x => [x, Schedule.bgColors[i]] as [string, string]
                            )
                        ),
                    []
                )
            )
            .sort((a, b) => (a[0] === b[0] ? 0 : a[0] < b[0] ? -1 : 1));
    }
    convertKey(key: string) {
        return window.catalog.convertKey(key, this.schedule.currentSchedule);
    }
}
