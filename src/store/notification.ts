/**
 * @module store
 * @author Hanzhi Zhou
 */

/**
 * the noti level type corresponds to the three different log levels available in Console
 * @see console.info
 * @see console.warn
 * @see console.error
 */
type ConsoleLevel = 'info' | 'error' | 'warn';
/**
 * the noti class type corresponds to the bootstrap color classes
 */
type NotiClass = 'info' | 'danger' | 'success' | 'warning';

/**
 * @typeparam T the type of the payload
 */
export interface NotiMsg<T> {
    level: ConsoleLevel | 'success';
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
 * map console types to bootstrap css classes
 */
const CLAS = Object.freeze({
    info: 'info',
    error: 'danger',
    warn: 'warning',
    success: 'success'
}) as { [x in ConsoleLevel | 'success']: NotiClass };

/**
 * map bootstrap css classes to notification type
 */
const CONS = Object.freeze({
    info: 'info',
    danger: 'error',
    success: 'info',
    warning: 'warn'
}) as { [x in NotiClass]: ConsoleLevel };

const LEVELS: { [x in NotiClass]: number } = Object.freeze({
    info: 0,
    success: 1,
    warning: 2,
    danger: 3
});

/**
 * the notification module encapsulates common functions used to
 * inform user about the results of certain actions
 */
class Notification implements NotiState {
    public msg = '';
    public cls: NotiClass | '' = '';
    /**
     * history of the notification states. index 0 corresponds to the most recent one
     */
    public history: Readonly<NotiItem>[] = [];
    private job: number | null = null;

    /**
     * display a notification to users.
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
        // new notification comes first
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

    /**
     * clear the current notification
     * @param timeout clear the current notification after `timeout` seconds. Default to 0, which clears the current notification immediately.
     */
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

    /**
     * display a notification to users.
     * by default, only notifications of higher level will override the previous notification.
     * @param msg the message to display
     * @param timeout timeout in second. this noti msg will be automatically cleared after timeout.
     * @param override force-override the previous notification, if it exists
     */
    public warn(msg: string, timeout = 5, override = false) {
        this.notify(msg, 'warning', timeout, override);
    }

    /**
     * display a notification to users.
     * by default, only notifications of higher level will override the previous notification.
     * @param msg the message to display
     * @param timeout timeout in second. this noti msg will be automatically cleared after timeout.
     * @param override force-override the previous notification, if it exists
     */
    public error(msg: string, timeout = 5, override = false) {
        this.notify(msg, 'danger', timeout, override);
    }

    /**
     * display a notification to users.
     * by default, only notifications of higher level will override the previous notification.
     * @param msg the message to display
     * @param timeout timeout in second. this noti msg will be automatically cleared after timeout.
     * @param override force-override the previous notification, if it exists
     */
    public success(msg: string, timeout = 5, override = false) {
        this.notify(msg, 'success', timeout, override);
    }

    /**
     * display a notification to users.
     * by default, only notifications of higher level will override the previous notification.
     * @param msg the message to display
     * @param timeout timeout in second. this noti msg will be automatically cleared after timeout.
     * @param override force-override the previous notification, if it exists
     */
    public info(msg: string, timeout = 5, override = false) {
        this.notify(msg, 'info', timeout, override);
    }
}

export default new Notification();
