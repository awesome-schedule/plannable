import { display } from '../../src/store/display';

describe('notification test', () => {
    it('basic', () => {
        expect(display.showInstructor).toBe(true);
        display.showTime = false;
        expect(display.showTime).toBe(false);
        display.fromJSON({ showTime: true });
        expect(display.showTime).toBe(true);
    });
});
