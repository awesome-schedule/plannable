import display from '@/store/display';

describe('notification test', () => {
    it('basic', () => {
        display.earliest = '13:00';
        expect(display.earliest).toBe('11:59');

        display.latest = '11:00';
        expect(display.latest).toBe('12:00');

        display.maxNumSchedules = 1000000000;
        expect(display.maxNumSchedules).toBe(5000000);

        display.numSearchResults = 10000;
        expect(display.numSearchResults).toBe(20);

        display.fullHeight = 10000;
        expect(display.fullHeight).toBe(100);

        display.partialHeight = 10000;
        expect(display.partialHeight).toBe(100);

        display.width = 10000;
        expect(display.width).toBe(1000);

        display.colorScheme = 1;
        expect(display.colorScheme).toBe(1);

        const str1 = JSON.stringify(display.toJSON());
        display.fromJSON(JSON.parse(str1));
        const str2 = JSON.stringify(display.toJSON());
        expect(str1).toBe(str2);
        display.getDefault();
    });
});
