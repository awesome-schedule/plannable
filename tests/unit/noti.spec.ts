import { noti } from '@/store/notification';

describe('notification test', () => {
    it('basic', () => {
        noti.info(';;;');
        expect(noti.msg).toBe(';;;');
        expect(noti.cls).toBe('info');

        noti.success('s');
        expect(noti.msg).toBe('s');
        expect(noti.cls).toBe('success');

        noti.warn('asd');
        expect(noti.msg).toBe('asd');
        expect(noti.cls).toBe('warning');

        noti.error('.');
        expect(noti.msg).toBe('.');
        expect(noti.cls).toBe('danger');

        noti.clear(0);

        noti.notify({
            msg: ' ',
            level: 'info'
        });
        expect(noti.msg).toBe(' ');
        expect(noti.cls).toBe('info');
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
