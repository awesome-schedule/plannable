/**
 * @module store
 */

/**
 *
 */
import { StoreModule } from '.';

export interface DisplayState {
    [x: string]: any;
    // course block options
    showTime: boolean;
    showRoom: boolean;
    showInstructor: boolean;
    showClasslistTitle: boolean;

    // grid schedule options
    fullHeight: number;
    partialHeight: number;
    earliest: string;
    latest: string;
    standard: boolean;

    // schedule compute options
    multiSelect: boolean;
    combineSections: boolean;
    maxNumSchedules: number;

    // search options
    expandOnEntering: boolean;
    numSearchResults: number;
}

// use class-interface merging
// tslint:disable-next-line: no-empty-interface
interface Display extends DisplayState {}
/**
 * the display module handles global display options
 * @author Hanzhi Zhou
 */
class Display implements StoreModule<DisplayState, DisplayState> {
    [x: string]: any;

    constructor() {
        Object.assign(this, this.getDefault());
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

    toJSON() {
        return { ...this };
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
            maxNumSchedules: 100000,
            expandOnEntering: false,
            numSearchResults: 6,
            enableLog: false,
            enableFuzzy: false
        };
    }
}

export const display = new Display();
export default display;
