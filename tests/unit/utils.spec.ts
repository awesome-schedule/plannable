import * as Utils from '../../src/models/Utils';
import 'jest';

describe('Utility Tests', () => {
    it('parse time', () => {
        expect(Utils.parseTimeAsInt('11:00AM', '1:30PM')).toEqual([11 * 60, 13 * 60 + 30]);
        expect(Utils.parseTimeAll('MoWeFr 11:00AM - 1:50PM')).toEqual([
            ['Mo', 'We', 'Fr'],
            [11 * 60, 13 * 60 + 50]
        ]);
        expect(Utils.parseTimeAll('TBA')).toBe(null);
    });

    it('to24hr', () => {
        expect(Utils.to24hr('5:00PM')).toBe('17:00');
        expect(Utils.to24hr('5:00AM')).toBe('5:00');
        expect(Utils.to24hr('12:00PM')).toBe('12:00');
        expect(Utils.to24hr('12:00AM')).toBe('00:00');

        expect(Utils.to24hr(Utils.to12hr('12:00'))).toBe('12:00');
    });

    it('time block conflict', () => {
        expect(Utils.checkTimeBlockStrConflict('12:00', '15:00', '15:00', '17:00')).toBe(true);
        expect(Utils.checkTimeBlockStrConflict('12:00', '15:00', '15:00', '17:00', false)).toBe(
            false
        );
    });

    it('Overlap test', () => {
        expect(Utils.calcOverlap(100, 200, 150, 250)).toBe(50);
        expect(Utils.calcOverlap(150, 250, 100, 200)).toBe(50);
        expect(Utils.calcOverlap(100, 300, 100, 200)).toBe(100);
    });

    // it('Depth first search', () => {});
});
