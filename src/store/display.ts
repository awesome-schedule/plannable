import { Module, VuexModule, Mutation, Action, getModule } from 'vuex-module-decorators';
import store from '.';

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
}

export const defaultDisplay: DisplayState = Object.freeze({
    showTime: false,
    showRoom: true,
    showInstructor: true,
    showClasslistTitle: false,
    fullHeight: 40,
    partialHeight: 25,
    earliest: '08:00:00',
    latest: '19:00:00',
    standard: false
});

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
    public showClasslistTitle = false;
    public fullHeight = 40;
    public partialHeight = 25;
    public earliest = '08:00:00';
    public latest = '19:00:00';
    public standard = false;

    @Mutation
    update(newSettings: Partial<DisplayState>) {
        for (const key in newSettings) {
            this[key] = newSettings[key];
        }
    }
}

export default getModule(Display);
