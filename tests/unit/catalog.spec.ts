import Catalog from '../../src/models/Catalog';
import data from './data';
import Schedule from '../../src/models/Schedule';

beforeAll(async () => {
    window.catalog = await data;
});

describe('catalog test', () => {
    it('search', () => {
        const catalog: Catalog = window.catalog;
        expect(catalog.search('cs', 6).length).toBe(6);
        expect(catalog.search('asdasdasd').length).toBe(0);
        expect(catalog.search('john').length).toBeGreaterThan(2);
    });

    it('convert key', () => {
        const catalog: Catalog = window.catalog;
        const schedule = new Schedule();
        schedule.addEvent('MoFr 10:00AM - 11:30AM', true, 'title asd');
        expect(catalog.convertKey('cs11105', schedule)).toBe('CS 1110 Lecture');
        expect(catalog.convertKey('123213213', schedule)).toBe('123213213');
        expect(catalog.convertKey('MoFr 10:00AM - 11:30AM', schedule)).toBe('title asd');
        // expect(catalog.convertKey(schedule)).toBe();
    });

    it('json', () => {
        const catalog: Catalog = window.catalog;
        expect(catalog.fromJSON(catalog.toJSON())).toEqual(catalog);
    });
});
