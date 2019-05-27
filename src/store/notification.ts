/**
 * the notification module encapsulates common functions used to inform user about the results of certain actions
 * @author Hanzhi Zhou
 */

/**
 * the noti level type corresponds to the three different log levels available in Console
 * @see console.info
 * @see console.warn
 * @see console.error
 */
type NotiLevel = 'info' | 'error' | 'warn';
/**
 * the noti class type corresponds to the bootstrap color classes
 */
type NotiClass = 'info' | 'danger' | 'success' | 'warning' | '';

/**
 * @typeparam T the type of the payload
 */
export interface NotiMsg<T> {
    level: NotiLevel;
    msg: string;
    payload?: T;
}

interface NotiState {
    msg: string;
    cls: NotiClass;
}

/**
 * the mapping from notification levels to bootstrap css classes
 */
const TYPES = Object.freeze({
    info: 'info',
    error: 'danger',
    success: 'success',
    warn: 'warning'
}) as { [x: string]: NotiClass };

const LEVELS: { [x in NotiClass]: number } = Object.freeze({
    '': -1,
    info: 0,
    success: 1,
    warning: 2,
    danger: 3
});

class Notification implements NotiState {
    public msg: string = '';
    public cls: NotiClass = '';
    public history: NotiState[] = [];
    private job: number | null = null;

    /**
     * display notification to users.
     * by default, only notifications of higher level will override the previous notification.
     * @param msg the message to display
     * @param type the type of notification
     * @param timeout timeout in second. this noti msg will be automatically cleared after timeout.
     * @param override force-override the previous notification, if it exists
     */
    public notify<T>(
        msg: string | NotiMsg<T>,
        type: 'info' | 'success' | 'warn' | 'error' = 'info',
        timeout = 5,
        override = false
    ) {
        let cls: NotiClass;
        if (typeof msg === 'string') {
            cls = TYPES[type];
        } else {
            cls = TYPES[msg.level];
            msg = msg.msg;
        }
        if (!this.cls || LEVELS[cls] >= LEVELS[this.cls] || override) {
            if (this.job) window.clearTimeout(this.job);
            this.history.push({
                msg: this.msg = msg,
                cls: this.cls = cls
            });
            this.clear(timeout);
        }
    }

    public empty() {
        return !this.msg && !this.cls;
    }

    public clear(timeout = 0) {
        if (timeout <= 0) {
            this.msg = '';
            this.cls = '';
            this.job = null;
        } else {
            this.job = window.setTimeout(() => this.clear(0), timeout * 1000);
        }
    }

    public clearHistory() {
        this.history = [];
    }

    public warn(msg: string, timeout = 5, override = false) {
        this.notify(msg, 'warn', timeout, override);
    }
    public error(msg: string, timeout = 5, override = false) {
        this.notify(msg, 'error', timeout, override);
    }
    public success(msg: string, timeout = 5, override = false) {
        this.notify(msg, 'success', timeout, override);
    }
    public info(msg: string, timeout = 5, override = false) {
        this.notify(msg, 'info', timeout, override);
    }
}

export const noti = new Notification();
export default noti;
