import * as Utils from '../../src/utils';
import 'jest';
import axios from 'axios';
import data from './data';

beforeAll(async () => {
    window.catalog = await data;
    window.open = jest.fn();
});

describe('Utility Tests', () => {
    it('parse time', () => {
        expect(Utils.parseTimeAsInt('11:00AM', '1:30PM')).toEqual([11 * 60, 13 * 60 + 30]);
        expect(Utils.parseTimeAll('MoWeFr 11:00AM - 1:50PM')).toEqual([
            ['Mo', 'We', 'Fr'],
            [11 * 60, 13 * 60 + 50]
        ]);
        expect(Utils.parseTimeAllAsDict('asdasd')).toEqual(null);
        expect(Utils.parseTimeAll('TBA')).toBe(null);
    });

    it('to24hr', () => {
        expect(Utils.to24hr('5:00PM')).toBe('17:00');
        expect(Utils.to24hr('5:00AM')).toBe('5:00');
        expect(Utils.to24hr('12:00PM')).toBe('12:00');
        expect(Utils.to24hr('12:00AM')).toBe('00:00');

        expect(Utils.to24hr(Utils.to12hr('12:00'))).toBe('12:00');
    });

    it('to12hr', () => {
        expect(Utils.to12hr('13:00')).toBe('1:00PM');
        expect(Utils.to12hr('11:00')).toBe('11:00AM');
        expect(Utils.to12hr('0:00')).toBe('12:00AM');
        expect(Utils.to12hr('12:00')).toBe('12:00PM');
    });

    it('Overlap test', () => {
        expect(Utils.calcOverlap(100, 200, 150, 250)).toBe(50);
        expect(Utils.calcOverlap(150, 250, 100, 200)).toBe(50);
        expect(Utils.calcOverlap(100, 300, 100, 200)).toBe(100);
    });

    it('err test', async () => {
        try {
            await axios.get('invalid');
        } catch (e) {
            expect(
                Utils.errToStr(e) === 'request rejected by the server' ||
                    Utils.errToStr(e) === 'No internet'
            ).toBeTruthy();
        }
        expect(Utils.errToStr('asd')).toBe('asd');
        expect(Utils.errToStr(new Error('asd') as any)).toBe('asd');
    });

    it('other', () => {
        Utils.openLousList(1198, 1);
        Utils.openVAGrade(window.catalog.getCourse('cs11105'));

        expect(Utils.timeToNum('12:00')).toBeTruthy();
        expect(Utils.timeToNum('12:00')).toBe(8);
        expect(Utils.timeToNum('12:30')).toBe(9);
        console.info(Utils.timeToNum('12:00'));
    });
});
