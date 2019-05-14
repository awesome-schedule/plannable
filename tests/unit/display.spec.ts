import { display } from '../../src/store/display';

describe('notification test', () => {
    it('basic', () => {
        expect(display.showInstructor).toBe(true);
        display.update({
            showTime: false
        });
        expect(display.showTime).toBe(false);
        display.update({
            showTime: true
        });
        expect(display.showTime).toBe(true);
    });
});
