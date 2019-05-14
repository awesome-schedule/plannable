/**
 * the notification class encapsulates common functions used to inform user about the results of certain actions
 * @author Hanzhi Zhou
 */

/**
 *
 */
import { Module, VuexModule, Mutation, getModule } from 'vuex-module-decorators';
import store from '.';

/**
 * the noti level type corresponds to the three different log levels available in Console
 * @see console.info
 * @see console.warn
 * @see console.error
 */
export type NotiLevel = 'info' | 'error' | 'warn';
/**
 * the noti class type corresponds to the bootstrap color classes
 */
export type NotiClass = 'info' | 'danger' | 'success' | 'warning' | '';

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
    class: NotiClass;
}

export const TYPES = Object.freeze({
    info: 'info',
    error: 'danger',
    success: 'success',
    warn: 'warning'
}) as { [x: string]: NotiClass };

@Module({
    store,
    name: 'noti',
    dynamic: true
})
class Notification extends VuexModule implements NotiState {
    public msg: string = '';
    public class: NotiClass = '';

    @Mutation
    public set({ msg, type }: { msg: string; type: NotiClass }) {
        this.msg = msg;
        this.class = type;
    }
}

/**
 * the noti wrapper wraps around the notification store so it is easier to mutate the state of the notification.
 */
// tslint:disable-next-line
class NotiWrapper {
    public noti = getModule(Notification);
    private job: number | null = null;

    public notify<T>(msg: string | NotiMsg<T>, type = 'info', timeout = 5) {
        if (this.job) window.clearTimeout(this.job);
        if (typeof msg === 'string') {
            this.noti.set({ msg, type: TYPES[type] });
            this.clear(timeout);
        } else {
            this.noti.set({ msg: msg.msg, type: TYPES[msg.level] });
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

export const noti = new NotiWrapper();
export default noti;
