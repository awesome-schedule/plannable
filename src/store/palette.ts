/**
 * the filter module handles manipulation of filters
 * @author Hanzhi Zhou
 */

/**
 *
 */
import { StoreModule } from '.';

export interface PaletteState {
    savedColors: { [x: string]: string };
}

class Palette implements StoreModule<PaletteState, PaletteState> {
    public savedColors: { [x: string]: string } = {};

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
