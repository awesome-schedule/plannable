/**
 * the display module handles global display options
 * @author Hanzhi Zhou
 */

/**
 *
 */
import { Vue, Component } from 'vue-property-decorator';
import { toJSON } from './helper';

const _defaultDisplay = {
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

type _DisplayState = typeof _defaultDisplay;

export interface DisplayState extends _DisplayState {
    [x: string]: any;
}

@Component
export class Display extends Vue implements DisplayState {
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
        return toJSON(this, _defaultDisplay);
    }

    getDefault(): DisplayState {
        return Object.assign({}, _defaultDisplay);
    }
}

export const display = new Display();
export default display;
