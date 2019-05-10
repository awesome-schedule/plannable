import { Module, VuexModule, Mutation, Action, getModule } from 'vuex-module-decorators';
import store from '.';

export interface DisplayState {
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
    _changeShowTime(bool: boolean) {
        this.showTime = bool;
    }

    @Action({ commit: '_changeShowTime' })
    changeShowTime(bool: boolean) {
        return bool;
    }

    @Mutation
    _update(newSettings: Partial<DisplayState>) {
        for (const key in newSettings) {
            (this as any)[key] = (newSettings as any)[key];
        }
    }

    @Action({ commit: '_update' })
    update(newSettings: Partial<DisplayState>) {
        return newSettings;
    }
}

export default getModule(Display);
