/**
 *
 * @see [[Notification]]
 * @author Hanzhi Zhou
 */

/**
 * @typeparam T the type of the payload
 */
export interface NotiMsg<T> {
    level: 'info' | 'error' | 'warn';
    msg: string;
    payload?: T;
}

/**
 * the notification class encapsulates common functions used to inform user about the results of certain actions
 */
export class Notification {
    public static readonly TYPES: { [x: string]: string } = Object.freeze({
        info: 'info',
        error: 'danger',
        danger: 'danger',
        success: 'success',
        warn: 'warning'
    });

    public msg: string;
    public class: string;
    public job: number | null;

    constructor() {
        this.msg = '';
        this.class = '';
        this.job = null;
    }
    public notify<T>(msg: NotiMsg<T>): void;
    public notify(msg: string, type: string, timeout: number): void;

    public notify<T>(msg: string | NotiMsg<T>, type = 'info', timeout = 5) {
        if (this.job) clearTimeout(this.job);
        if (typeof msg === 'string') {
            this.msg = msg;
            this.class = Notification.TYPES[type];
            this.clear(timeout);
        } else {
            this.msg = msg.msg;
            this.class = Notification.TYPES[msg.level];
            this.clear(timeout);
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

    public clear(timeout = 0) {
        if (timeout <= 0) {
            this.msg = '';
            this.class = '';
            this.job = null;
        } else {
            this.job = window.setTimeout(() => this.clear(0), timeout * 1000);
        }
    }
}

export default Notification;
