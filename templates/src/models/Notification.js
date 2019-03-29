//@ts-check
/// <reference path="../../node_modules/@types/jquery/index.d.ts" />
/// <reference path="../../node_modules/@types/bootstrap-notify/index.d.ts" />
class Notification {
    static TYPES = {
        info: 'info',
        error: 'danger',
        danger: 'danger',
        success: 'success',
        warn: 'warning'
    };
    constructor() {
        this.msg = '';
        this.class = '';
        this.job = null;
    }
    /**
     *
     * @param {string} msg
     * @param {string} type
     * @param {number} timeout
     */
    notify(msg, type, timeout = 5) {
        if (this.job) clearTimeout(this.job);
        this.msg = msg;
        this.class = Notification.TYPES[type];
        this.clear(timeout);
        // $.notify(
        //     {
        //         // options
        //         message: msg
        //     },
        //     {
        //         // settings
        //         type: Notification.TYPES[type],
        //         timer: 0,
        //         delay: timeout * 1000,
        //         position: 'fixed',
        //         placement: {
        //             from: 'top',
        //             align: 'center'
        //         }
        //     }
        // );
    }
    /**
     *
     * @param {string} msg
     * @param {number} [timeout=5]
     */
    warn(msg, timeout = 5) {
        this.notify(msg, 'warn', timeout);
    }
    /**
     *
     * @param {string} msg
     * @param {number} [timeout=5]
     */
    error(msg, timeout = 5) {
        this.notify(msg, 'error', timeout);
    }
    /**
     *
     * @param {string} msg
     * @param {number} [timeout=5]
     */
    success(msg, timeout = 5) {
        this.notify(msg, 'success', timeout);
    }
    /**
     *
     * @param {string} msg
     * @param {number} [timeout=5]
     */
    info(msg, timeout = 5) {
        this.notify(msg, 'info', timeout);
    }

    clear(timeout = 0) {
        if (timeout <= 0) {
            this.msg = '';
            this.type = '';
            this.job = null;
        } else {
            this.job = setTimeout(() => {
                this.clear(0);
            }, timeout * 1000);
        }
    }
}

export default Notification;
