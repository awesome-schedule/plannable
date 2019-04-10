import * as Utils from '../../src/models/Utils';
import 'jest';

describe('Utility Tests', () => {
    it('parse time', () => {
        expect(Utils.parseTimeAsString('11:00AM', '1:00PM')).toEqual(['11:00', '13:00']);
        expect(Utils.parseTimeAsInt('11:00AM', '1:30PM')).toEqual([11 * 60, 13 * 60 + 30]);
        expect(Utils.parseTimeAll('MoWeFr 11:00AM - 1:50PM')).toEqual([
            ['Mo', 'We', 'Fr'],
            [11 * 60, 13 * 60 + 50]
        ]);
        expect(Utils.parseTimeAll('TBA')).toBe(null);
    });
});
