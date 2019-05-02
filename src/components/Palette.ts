import { Vue, Component, Prop } from 'vue-property-decorator';
import Schedule from '../models/Schedule';
import randomColor from 'randomcolor';

@Component
export default class Palette extends Vue {
    @Prop(Schedule) readonly schedule!: Schedule;

    parent = this.$parent as any;

    randomColor() {
        return randomColor({
            luminosity: 'dark'
        });
    }
    setColor(key: string, color: string) {
        this.schedule.setColor(key, color);
        this.parent.saveStatus();
        this.$forceUpdate();
    }
    numColors() {
        return (
            Object.entries(Schedule.savedColors).filter(entry => this.schedule.has(entry[0]))
                .length + this.schedule.colorSlots.reduce((acc, x) => x.size + acc, 0)
        );
    }
    /**
     * colors must always be recomputed because `Schedule.savedColors` is not a reactive property
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
        return window.catalog.convertKey(this.parent.currentSchedule, key);
    }
}
