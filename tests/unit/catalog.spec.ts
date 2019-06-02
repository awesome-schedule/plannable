import Catalog from '@/models/Catalog';
import data from './data';
import Schedule from '@/models/Schedule';

beforeAll(async () => {
    const catalog = await data;
    catalog.raw_data.cs45015[6].push([
        19281,
        '001',
        'testtesttest',
        2,
        93,
        91,
        52,
        [['Comp. Vision', 'MoWe 5:00PM - 6:15PM', 'Thornton Hall E316', '08/27/2019 - 12/06/2019']]
    ]);
    window.catalog = catalog;
});

describe('catalog test', () => {
    it('search', () => {
        const catalog: Catalog = window.catalog;
        expect(catalog.search('cs', 6).length).toBe(6);
        expect(catalog.search('asdasdasajkgwuoeisd').length).toBe(0);
        expect(catalog.search('john').length).toBeGreaterThan(2);
        expect(catalog.search('aaron bloomf').length).toBeGreaterThan(2);
        expect(catalog.search('discre').length).toBeGreaterThan(1);
        expect(catalog.search('quantum').length).toBeGreaterThan(1);
        expect(catalog.search('comp. visio').length).toBeGreaterThanOrEqual(1);
        console.info(catalog.search('comp. visio'));

        expect(catalog.search(':desc a').length).toBeGreaterThan(1);
        expect(catalog.search(':prof asdasdasdasdasdasdsad').length).toBe(0);
    });

    it('convert key', () => {
        const catalog: Catalog = window.catalog;
        const schedule = new Schedule();
        schedule.addEvent('MoFr 10:00AM - 11:30AM', true, 'title asd');
        expect(catalog.convertKey('cs11105', schedule)).toBe('CS 1110 Lecture');
        expect(catalog.convertKey('123213213', schedule)).toBe('123213213');
        expect(catalog.convertKey('MoFr 10:00AM - 11:30AM', schedule)).toBe('title asd');
    });

    it('json', () => {
        const catalog: Catalog = window.catalog;
        expect(catalog.fromJSON(catalog.toJSON()).raw_data).toEqual(catalog.raw_data);
    });

    it('other', () => {
        try {
            window.catalog.getSection('asdasdasdasdas', 1);
        } catch (e) {
            expect(e.message).toBeTruthy();
        }
    });
});
