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
type NotiClass = 'info' | 'danger' | 'success' | 'warning';

/**
 * @typeparam T the type of the payload
 */
export interface NotiMsg<T> {
    level: NotiLevel;
    msg: string;
    payload?: T;
}

/**
 * the current state of the notification
 */
interface NotiState {
    /**
     * the notification message
     */
    msg: string;
    /**
     * @see [[NotiClass]]
     */
    cls: NotiClass | '';
}

/**
 * A notification item represents a notification state in the past
 */
interface NotiItem extends NotiState {
    /**
     * time stamp created by
     * ```js
     * new Date().toLocaleTimeString()
     * ```
     */
    stamp: string;
}

/**
 * map notification types to bootstrap css classes
 */
const CLAS = Object.freeze({
    info: 'info',
    error: 'danger',
    warn: 'warning'
}) as { [x in NotiLevel]: NotiClass };

/**
 * map bootstrap css classes to notification type
 */
const CONS = Object.freeze({
    info: 'info',
    danger: 'error',
    success: 'info',
    warning: 'warn'
}) as { [x in NotiClass]: NotiLevel };

const LEVELS: { [x in NotiClass]: number } = Object.freeze({
    info: 0,
    success: 1,
    warning: 2,
    danger: 3
});

class Notification implements NotiState {
    public msg: string = '';
    public cls: NotiClass | '' = '';
    /**
     * history of the notification states. index 0 corresponds to the most recent one
     */
    public history: NotiItem[] = [];
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
        cls: NotiClass = 'info',
        timeout = 5,
        override = false
    ) {
        if (typeof msg !== 'string') {
            cls = CLAS[msg.level];
            msg = msg.msg;
        }
        this.history.unshift({
            msg,
            cls,
            stamp: new Date().toLocaleTimeString()
        });
        console[CONS[cls]](msg);
        if (!this.cls || LEVELS[cls] >= LEVELS[this.cls] || override) {
            if (this.job) window.clearTimeout(this.job);
            this.msg = msg;
            this.cls = cls;
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
        this.notify(msg, 'warning', timeout, override);
    }
    public error(msg: string, timeout = 5, override = false) {
        this.notify(msg, 'danger', timeout, override);
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
