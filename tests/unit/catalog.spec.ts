import Catalog from '../../src/models/Catalog';
import data from './data';
import Schedule from '../../src/models/Schedule';

describe('catalog test', () => {
    it('search', async () => {
        const catalog: Catalog = await data;
        expect(catalog.search('cs', 6).length).toBe(6);
        expect(catalog.search('asdasdasd').length).toBe(0);
        expect(catalog.search('john').length).toBeGreaterThan(2);
    });

    it('convert key', async () => {
        const catalog: Catalog = await data;
        expect(catalog.convertKey(new Schedule(), 'cs11105')).toBe('CS 1110 Lecture');
        expect(catalog.convertKey(new Schedule(), '123213213')).toBe('123213213');
    });
});
