/**
 * the notification modules encapsulates common functions used to inform user about the results of certain actions
 * @author Hanzhi Zhou
 */

/**
 *
 */
import { Vue, Component } from 'vue-property-decorator';

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

/**
 * the mapping from notification levels to bootstrap css classes
 */
export const TYPES = Object.freeze({
    info: 'info',
    error: 'danger',
    success: 'success',
    warn: 'warning'
}) as { [x: string]: NotiClass };

@Component
class Notification extends Vue implements NotiState {
    public msg: string = '';
    public class: NotiClass = '';
    private job: number | null = null;

    public notify<T>(msg: string | NotiMsg<T>, type = 'info', timeout = 5) {
        if (this.job) window.clearTimeout(this.job);
        if (typeof msg === 'string') {
            this.msg = msg;
            this.class = TYPES[type];
            this.clear(timeout);
        } else {
            this.msg = msg.msg;
            this.class = TYPES[msg.level];
            this.clear(timeout);
        }
    }

    public clear(timeout = 0) {
        if (timeout <= 0) {
            this.msg = '';
            this.class = '';
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

export const noti = new Notification();
export default noti;
