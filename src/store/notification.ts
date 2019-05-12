/**
 * the notification class encapsulates common functions used to inform user about the results of certain actions
 * @author Hanzhi Zhou
 */

/**
 *
 */
import { Module, VuexModule, Mutation, getModule } from 'vuex-module-decorators';
import store from '.';

export type NotiLevel = 'info' | 'error' | 'warn';

/**
 * @typeparam T the type of the payload
 */
export interface NotiMsg<T> {
    level: NotiLevel;
    msg: string;
    payload?: T;
}

export interface NotiState {
    msg: string;
    class: string;
}

export const TYPES: { [x: string]: string } = Object.freeze({
    info: 'info',
    error: 'danger',
    success: 'success',
    warn: 'warning'
});

@Module({
    store,
    name: 'noti',
    dynamic: true
})
class Notification extends VuexModule implements NotiState {
    public msg: string = '';
    public class: string = '';

    @Mutation
    public set({ msg, type }: { msg: string; type: string }) {
        this.msg = msg;
        this.class = type;
    }
}

// tslint:disable-next-line
class NotiWrapper {
    public job: number | null = null;
    private noti = getModule(Notification);

    public notify<T>(msg: string | NotiMsg<T>, type = 'info', timeout = 5) {
        if (this.job) window.clearTimeout(this.job);
        if (typeof msg === 'string') {
            type = TYPES[msg];
            this.noti.set({ msg, type });
            this.clear(timeout);
        } else {
            type = TYPES[msg.level];
            this.noti.set({ msg: msg.msg, type });
            this.clear(timeout);
        }
    }

    public clear(timeout = 0) {
        if (timeout <= 0) {
            this.noti.set({ msg: '', type: '' });
            this.job = null;
        } else {
            this.job = window.setTimeout(() => this.clear(0), timeout * 1000);
        }
    }

    public warn(msg: string, timeout = 5) {
        this.notify(msg, 'warn', timeout);
    }
    public error(msg: string, timeout = 5) {
        this.notify(msg, 'error', timeout);
    }
    public success(msg: string, timeout = 5) {
        this.notify(msg, 'success', timeout);
    }
    public info(msg: string, timeout = 5) {
        this.notify(msg, 'info', timeout);
    }
}

export default new NotiWrapper();
