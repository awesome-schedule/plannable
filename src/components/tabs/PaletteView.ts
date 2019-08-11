/**
 * @module components/tabs
 */

/**
 *
 */
import Schedule from '@/models/Schedule';
import Store from '@/store';
import randomColor from 'randomcolor';
import { Component } from 'vue-property-decorator';

/**
 * the component for customizing colors of classes and events
 * @author Hanzhi Zhou
 * @noInheritDoc
 */
@Component
export default class Palette extends Store {
    set(key: string, color: string) {
        this.$set(this.palette.savedColors, key, color);
    }
    randColor(key: string) {
        this.$set(this.palette.savedColors, key, randomColor({
            luminosity: 'dark'
        }) as string);
    }

    colorEntries() {
        return Object.entries(this.palette.savedColors).filter(entry =>
            this.schedule.currentSchedule.has(entry[0], true)
        );
    }
    /**
     * get the number of events and courses that have colors in total
     */
    numColors() {
        return (
            this.colorEntries().length +
            this.schedule.currentSchedule.colorSlots.reduce((acc, x) => x.size + acc, 0)
        );
    }
    /**
     * @note colors must always be recomputed because `Schedule.savedColors` is not a reactive property
     */
    courseColors() {
        return this.colorEntries()
            .concat(
                this.schedule.currentSchedule.colorSlots.reduce(
                    (arr: [string, string][], bucket, i) =>
                        arr.concat(
                            [...bucket]
                                .filter(
                                    key =>
                                        this.schedule.currentSchedule.has(key, true) &&
                                        !(key in this.palette.savedColors)
                                )
                                .map(x => [x, Schedule.bgColors[i]] as [string, string])
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
