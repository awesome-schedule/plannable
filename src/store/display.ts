/**
 * the display module handles global display options
 * @author Hanzhi Zhou
 */

/**
 *
 */
import { Vue, Component, Watch } from 'vue-property-decorator';
import { toJSON } from './helper';
import Schedule from '../models/Schedule';
import schedule from './schedule';

export interface DisplayState {
    [x: string]: any;
    showTime: boolean;
    showRoom: boolean;
    showInstructor: boolean;
    showClasslistTitle: boolean;
    fullHeight: number;
    partialHeight: number;
    earliest: string;
    latest: string;
    standard: boolean;
    multiSelect: boolean;
    combineSections: boolean;
    maxNumSchedules: number;
}

@Component
class Display extends Vue implements DisplayState {
    [x: string]: any;
    public showTime = false;
    public showRoom = true;
    public showInstructor = true;
    public showClasslistTitle = true;
    public fullHeight = 40;
    public partialHeight = 25;
    public earliest = '08:00:00';
    public latest = '19:00:00';
    public standard = false;
    public multiSelect = true;
    public combineSections = true;
    public maxNumSchedules = 200000;

    @Watch('multiSelect')
    multiSelectWatch() {
        Schedule.options.multiSelect = this.multiSelect;
        schedule.currentSchedule.computeSchedule();
    }

    @Watch('combineSections')
    combineSectionsWatch() {
        Schedule.options.combineSections = this.combineSections;
        schedule.currentSchedule.computeSchedule();
    }

    fromJSON(obj: Partial<DisplayState>) {
        const defaultVal = this.getDefault();
        for (const key in defaultVal) {
            const val = obj[key];
            const defVal = defaultVal[key];
            if (typeof val === typeof defVal) {
                this[key] = val;
            } else {
                this[key] = defVal;
            }
        }
    }

    toJSON(): DisplayState {
        return toJSON(this);
    }

    getDefault(): DisplayState {
        return {
            showTime: false,
            showRoom: true,
            showInstructor: true,
            showClasslistTitle: true,
            fullHeight: 40,
            partialHeight: 25,
            earliest: '08:00:00',
            latest: '19:00:00',
            standard: false,
            multiSelect: true,
            combineSections: true,
            maxNumSchedules: 200000
        };
    }
}

export const display = new Display();
export default display;
