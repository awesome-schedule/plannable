import { noti } from '../../src/store/notification';

describe('notification test', () => {
    it('basic', () => {
        noti.warn('asd');
        expect(noti.noti.msg).toBe('asd');
        expect(noti.noti.class).toBe('warning');

        noti.success('s');
        expect(noti.noti.msg).toBe('s');
        expect(noti.noti.class).toBe('success');

        noti.info(';;;');
        expect(noti.noti.msg).toBe(';;;');
        expect(noti.noti.class).toBe('info');

        noti.error('.');
        expect(noti.noti.msg).toBe('.');
        expect(noti.noti.class).toBe('danger');

        noti.notify({
            msg: ' ',
            level: 'info'
        });
        expect(noti.noti.msg).toBe(' ');
        expect(noti.noti.class).toBe('info');
    });

    it('timeout', async () => {
        noti.error('.');
        expect(noti.noti.msg).toBe('.');
        noti.clear(0);
        expect(noti.noti.msg).toBeFalsy();

        noti.error('.', 0.01);
        await new Promise(resolve => {
            setTimeout(() => resolve(), 100);
        });
        expect(noti.noti.msg).toBeFalsy();
    });
});
