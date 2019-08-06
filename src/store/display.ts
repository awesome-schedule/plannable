/**
 * @module store
 */

/**
 *
 */
import { StoreModule } from '.';
import { hr24toInt } from '@/utils';

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

    // weekdays
    showWeekend: boolean;
}

function bound(num: number, low: number, high: number) {
    return Math.min(Math.max(low, num), high);
}

function intTo24hr(num: number) {
    return `${Math.floor(num / 60)
        .toString()
        .padStart(2, '0')}:${(num % 60).toString().padStart(2, '0')}`;
}

export type DisplayJSONShort = [number, ...any[]];

/**
 * the display module handles global display options
 * @author Hanzhi Zhou
 */
export class Display implements StoreModule<DisplayState, DisplayState> {
    public static compressJSON(obj: DisplayState) {
        // get all keys in the display object and sort them
        const display_keys = Object.keys(obj).sort();

        // display_keys: "combineSections","enableFuzzy","enableLog","expandOnEntering","multiSelect",
        // "showClasslistTitle","showInstructor","showRoom","showTime","showWeekend","standard"
        
        const result: DisplayJSONShort = [0];
        console.log(display_keys);
        // convert to binary, the first key => the first/rightmost bit
        let display_bit = 0;
        let counter = 1;
        for (const key of display_keys) {
            if (display[key] === true) {
                display_bit |= counter;
                counter <<= 1;
            } else if (display[key] === false) {
                counter <<= 1;
            } else {
                result.push(display[key]);
            }
        }
        result[0] = display_bit;
        return result;
    }
    public static decompressJSON(obj: DisplayJSONShort) {
        const displaySettings = new Display();

        // get and sort keys in displaySettings
        const keys = Object.keys(displaySettings).sort();

        // if the key name contains '_' then it corresponds to a certain index in data
        // else it is in the binary
        let counter = 1;
        let display_bit: number = obj[0];
        for (const key of keys) {
            if (key.includes('_')) {
                displaySettings[key] = obj[counter++];
            } else {
                displaySettings[key] = display_bit % 2 === 1 ? true : false;
                display_bit = Math.floor(display_bit / 2);
            }
        }
        return displaySettings;
    }
    [x: string]: any;
    showTime = false;
    showRoom = true;
    showInstructor = true;
    showClasslistTitle = true;
    standard = false;
    multiSelect = true;
    combineSections = true;
    expandOnEntering = false;
    enableLog = false;
    enableFuzzy = false;
    showWeekend = true;

    private _fullHeight: number = 40;
    private _partialHeight: number = 25;
    private _maxNumSchedules: number = 100000;
    private _numSearchResults: number = 6;
    private _earliest = '08:00';
    private _latest = '19:00';

    // validators
    get fullHeight() {
        return this._fullHeight;
    }
    set fullHeight(x) {
        this._fullHeight = bound(x, 1, 100);
    }
    get partialHeight() {
        return this._partialHeight;
    }
    set partialHeight(x) {
        this._partialHeight = bound(x, 1, 100);
    }
    get numSearchResults() {
        return this._numSearchResults;
    }
    set numSearchResults(x) {
        this._numSearchResults = bound(x, 1, 20);
    }
    get maxNumSchedules() {
        return this._maxNumSchedules;
    }
    set maxNumSchedules(x) {
        this._maxNumSchedules = bound(x, 1000, 2000000);
    }
    get earliest() {
        return this._earliest;
    }
    set earliest(e) {
        this._earliest = intTo24hr(bound(hr24toInt(e), 0, 12 * 60 - 1));
    }
    get latest() {
        return this._latest;
    }
    set latest(e) {
        this._latest = intTo24hr(bound(hr24toInt(e), 12 * 60, 24 * 60 - 1));
    }

    // when doing serialization, we only record the enumerable properties
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
