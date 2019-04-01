class Notification {
    public static readonly TYPES: { [x: string]: string } = {
        info: 'info',
        error: 'danger',
        danger: 'danger',
        success: 'success',
        warn: 'warning'
    };
    public msg: string;
    public class: string;
    public job: NodeJS.Timeout | null;
    constructor() {
        this.msg = '';
        this.class = '';
        this.job = null;
    }
    public notify(msg: string, type: string, timeout = 5) {
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
            this.job = setTimeout(() => {
                this.clear(0);
            }, timeout * 1000);
        }
    }
}

export default Notification;
