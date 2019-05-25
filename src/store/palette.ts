/**
 * the palette module handles the customization of colors of courses and events
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
