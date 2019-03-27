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
    notify(msg, type, timeout = 5) {
        if (this.job) clearTimeout(this.job);
        this.msg = msg;
        this.class = Notification.TYPES[type];
        this.clear(timeout);
    }
    warn(msg, timeout = 5) {
        this.notify(msg, 'warn', timeout);
    }
    error(msg, timeout = 5) {
        this.notify(msg, 'error', timeout);
    }
    success(msg, timeout = 5) {
        this.notify(msg, 'success', timeout);
    }
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
