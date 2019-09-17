/**
 * @module store
 */

/**
 *
 */
import { hr24toInt, intTo24hr } from '@/utils';
import { StoreModule } from '.';

export interface DisplayState {
    [x: string]: any;
    // course block options
    showTime: boolean;
    showRoom: boolean;
    showInstructor: boolean;
    showClasslistTitle: boolean;
    showSuffix: boolean;

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

export type DisplayJSONShort = [number, ...any[]];

/**
 * the display module handles global display options
 * @author Hanzhi Zhou
 */
export class Display implements StoreModule<DisplayState, DisplayState> {
    public static compressJSON(obj: DisplayState) {
        // get all keys in the display object and sort them
        const keys = Object.keys(obj).sort();
        const result: DisplayJSONShort = [0];

        // convert to binary, the first key => the first/rightmost bit
        let bits = 0;
        let counter = 1;
        for (const key of keys) {
            if (obj[key] === true) {
                bits |= counter;
                counter <<= 1;
            } else if (obj[key] === false) {
                counter <<= 1;
            } else {
                result.push(obj[key]);
            }
        }
        result[0] = bits;
        return result;
    }
    public static decompressJSON(obj: DisplayJSONShort) {
        const displaySettings = new Display();

        // get and sort keys in displaySettings
        const keys = Object.keys(displaySettings).sort();

        // if the key name contains '_' then it corresponds to a certain index in data
        // else it is in the binary
        let counter = 1,
            mask = 1;
        const bits = obj[0];
        for (const key of keys) {
            if (key.startsWith('_')) {
                displaySettings[key] = obj[counter++];
            } else {
                displaySettings[key] = Boolean(bits & mask);
                mask <<= 1;
            }
        }
        return displaySettings;
    }

    [x: string]: any;
    showTime = false;
    showRoom = true;
    showInstructor = true;
    showClasslistTitle = true;
    showSuffix = true;
    standard = false;
    multiSelect = true;
    combineSections = true;
    expandOnEntering = false;
    enableLog = false;
    enableFuzzy = false;
    showWeekend = true;

    private _fullHeight = 40;
    private _partialHeight = 30;
    private _maxNumSchedules = 200000;
    private _numSearchResults = 6;
    private _earliest = '08:00';
    private _latest = '19:00';
    private _width = 100;

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
        this._maxNumSchedules = bound(x, 1000, 5000000);
    }
    get earliest() {
        return this._earliest;
    }
    set earliest(e) {
        this._earliest = intTo24hr(bound(hr24toInt(e || '8:00'), 0, 12 * 60 - 1));
    }
    get latest() {
        return this._latest;
    }
    set latest(e) {
        this._latest = intTo24hr(bound(hr24toInt(e || '22:00'), 12 * 60, 24 * 60 - 1));
    }
    get width() {
        return this._width;
    }
    set width(e) {
        this._width = bound(e, 10, 1000);
    }

    // when doing serialization, we only record the enumerable properties, excluding the getters
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

export default new Display();
