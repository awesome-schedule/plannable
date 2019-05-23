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
import randomColor from 'randomcolor';
import schedule from '../store/schedule';
import { saveStatus } from '@/store/helper';

@Component
export default class Palette extends Vue {
    get schedule() {
        return schedule.currentSchedule;
    }

    randomColor() {
        return randomColor({
            luminosity: 'dark'
        });
    }
    setColor(key: string, color: string) {
        this.schedule.setColor(key, color);
        this.$forceUpdate();
        saveStatus();
    }
    /**
     * get the number of events and courses that have colors in total
     */
    numColors() {
        return (
            Object.entries(Schedule.savedColors).filter(entry => this.schedule.has(entry[0]))
                .length + this.schedule.colorSlots.reduce((acc, x) => x.size + acc, 0)
        );
    }
    /**
     *
     * @note colors must always be recomputed because `Schedule.savedColors` is not a reactive property
     */
    courseColors() {
        return Object.entries(Schedule.savedColors)
            .filter(entry => this.schedule.has(entry[0]))
            .concat(
                this.schedule.colorSlots.reduce(
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
        return window.catalog.convertKey(key, schedule.currentSchedule);
    }
}
