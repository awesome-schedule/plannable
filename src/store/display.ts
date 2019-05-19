/**
 * the display module handles global display options
 * @author Hanzhi Zhou
 */

/**
 *
 */
import { Module, VuexModule, Mutation, getModule } from 'vuex-module-decorators';
import store from '.';

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

export const defaultDisplay = Object.freeze(_defaultDisplay);

type _DisplayState = typeof _defaultDisplay;

export interface DisplayState extends _DisplayState {
    [x: string]: any;
}

@Module({
    store,
    name: 'display',
    dynamic: true
})
class Display extends VuexModule implements DisplayState {
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

    @Mutation
    update(newSettings: Partial<DisplayState>) {
        for (const key in newSettings) {
            this[key] = newSettings[key];
        }
    }
}

export const display = getModule(Display);
export default display;
