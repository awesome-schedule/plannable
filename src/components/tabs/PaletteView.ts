/**
 * @module src/components/tabs
 */

/**
 *
 */
import Schedule from '@/models/Schedule';
import Store from '@/store';
import randomColor from 'randomcolor';
import { Component } from 'vue-property-decorator';
import colorSchemes from '@/data/ColorSchemes';

/**
 * the component for customizing colors of classes and events
 * @author Hanzhi Zhou
 * @noInheritDoc
 */
@Component
export default class Palette extends Store {
    get colorSchemes() {
        return colorSchemes;
    }
    mounted() {
        document.getElementById('scheme-active')!.scrollIntoView();
        document.getElementById('palette-nav')!.scroll(0, 0);
    }
    set(key: string, color: string) {
        this.$set(this.palette.savedColors, key, color);
    }
    randColor(key: string) {
        this.$set(this.palette.savedColors, key, randomColor({ luminosity: 'dark' }));
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
        const colors = Schedule.colors;
        return this.colorEntries()
            .concat(
                this.schedule.currentSchedule.colorSlots.reduce<[string, string][]>(
                    (arr, bucket, i) => {
                        for (const key of bucket) {
                            if (
                                !(key in this.palette.savedColors) &&
                                this.schedule.currentSchedule.has(key, true)
                            ) {
                                arr.push([key, colors[i]]);
                            }
                        }
                        return arr;
                    },
                    []
                )
            )
            .sort((a, b) => (a[0] === b[0] ? 0 : a[0] < b[0] ? -1 : 1));
    }
    convertKey(key: string) {
        return window.catalog.convertKey(key, this.schedule.currentSchedule);
    }
}
