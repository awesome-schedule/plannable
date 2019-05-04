import { Notification } from '../../src/utils';

describe('notification test', () => {
    it('noti-test', () => {
        const noti = new Notification();
        noti.error('asd1');
        noti.info('asd2');
        expect(noti.msg).toBe('asd2');
        noti.notify({
            msg: 'test',
            level: 'error'
        });
        expect(noti.msg).toBe('test');
    });

    it('noti time', async () => {
        const noti = new Notification();
        noti.warn('asd1', 0.6);
        const _ = await new Promise(accept => {
            setTimeout(() => accept(), 1000);
        });
        expect(noti.msg).toBe('');
    });
});
