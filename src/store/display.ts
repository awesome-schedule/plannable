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

function bound(num: number, low: number, high: number) {
    return Math.min(Math.max(low, num), high);
}

/**
 * the display module handles global display options
 * @author Hanzhi Zhou
 */
// @Component
class Display implements StoreModule<DisplayState, DisplayState> {
    [x: string]: any;
    showTime = false;
    showRoom = true;
    showInstructor = true;
    showClasslistTitle = true;
    earliest = '08:00';
    latest = '19:00';
    standard = false;
    multiSelect = true;
    combineSections = true;
    expandOnEntering = false;
    enableLog = false;
    enableFuzzy = false;

    private _fullHeight: number = 40;
    private _partialHeight: number = 25;
    private _maxNumSchedules: number = 100000;
    private _numSearchResults: number = 6;

    get fullHeight() {
        return this._fullHeight;
    }
    set fullHeight(x) {
        this._fullHeight = bound(x, 2, 100);
    }
    get partialHeight() {
        return this._partialHeight;
    }
    set partialHeight(x) {
        this._partialHeight = bound(x, 2, 100);
    }
    get numSearchResults() {
        return this._numSearchResults;
    }
    set numSearchResults(x) {
        this._numSearchResults = bound(x, 1, 50);
    }
    get maxNumSchedules() {
        return this._maxNumSchedules;
    }
    set maxNumSchedules(x) {
        this._maxNumSchedules = bound(x, 1000, 1000000);
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
        return this;
    }

    getDefault() {
        return new Display();
    }
}

export const display = new Display();
export default display;
