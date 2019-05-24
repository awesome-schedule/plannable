/**
 * the filter module handles manipulation of filters
 * @author Hanzhi Zhou
 */

/**
 *
 */
import { Vue, Component, Watch } from 'vue-property-decorator';
import { StoreModule } from '.';
import schedule from './schedule';
import Schedule from '../models/Schedule';
import randomColor from 'randomcolor';

export interface PaletteState {
    savedColors: { [x: string]: string };
}

@Component
class Palette extends Vue implements StoreModule<PaletteState, PaletteState> {
    public savedColors = {};

    set(key: string, color: string) {
        this.$set(this.savedColors, key, color);
    }
    randColor(key: string) {
        this.$set(this.savedColors, key, randomColor({
            luminosity: 'dark'
        }) as string);
    }

    get colorEntries() {
        return Object.entries(this.savedColors).filter(entry =>
            schedule.currentSchedule.has(entry[0])
        );
    }

    @Watch('savedColors', { deep: true })
    wat() {
        Schedule.savedColors = this.savedColors;
        schedule.currentSchedule.computeSchedule();
    }

    fromJSON(obj: PaletteState) {
        this.savedColors = obj.savedColors || {};
    }

    getDefault(): PaletteState {
        return {
            savedColors: {}
        };
    }

    toJSON(): PaletteState {
        return {
            savedColors: this.savedColors
        };
    }
}

export const palette = new Palette();
export default palette;
