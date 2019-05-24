import { noti } from '@/store/notification';

describe('notification test', () => {
    it('basic', () => {
        noti.warn('asd');
        expect(noti.msg).toBe('asd');
        expect(noti.class).toBe('warning');

        noti.success('s');
        expect(noti.msg).toBe('s');
        expect(noti.class).toBe('success');

        noti.info(';;;');
        expect(noti.msg).toBe(';;;');
        expect(noti.class).toBe('info');

        noti.error('.');
        expect(noti.msg).toBe('.');
        expect(noti.class).toBe('danger');

        noti.notify({
            msg: ' ',
            level: 'info'
        });
        expect(noti.msg).toBe(' ');
        expect(noti.class).toBe('info');
    });

    it('timeout', async () => {
        noti.error('.');
        expect(noti.msg).toBe('.');
        noti.clear(0);
        expect(noti.msg).toBeFalsy();

        noti.error('.', 0.01);
        await new Promise(resolve => {
            setTimeout(() => resolve(), 100);
        });
        expect(noti.msg).toBeFalsy();
    });
});
