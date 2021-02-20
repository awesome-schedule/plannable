import ProposedSchedule from '@/models/ProposedSchedule';

describe('catalog test', () => {
    it('search', () => {
        const catalog = window.catalog;
        expect(catalog.search('comp. visio')[0].length).toBeGreaterThanOrEqual(1);
        expect(catalog.search('cs', 6)[0].length).toBe(6);
        expect(catalog.search('asdasdasajkgwuoeisd')[0].length).toBe(0);
        expect(catalog.search('john')[0].length).toBeGreaterThan(2);
        expect(catalog.search('aaron bloomf')[0].length).toBeGreaterThan(2);
        expect(catalog.search('discre')[0].length).toBeGreaterThan(1);
        expect(catalog.search('quantum')[0].length).toBeGreaterThan(1);

        expect(catalog.search(':desc a')[0].length).toBeGreaterThan(1);
        expect(catalog.search(':prof asdasdasdasdasdasdsad')[0].length).toBe(0);

        expect(catalog.fuzzySearch('comp. vision')[0][0].key.includes('cs4501')).toBe(true);
        expect(
            catalog.fuzzySearch('data structures and representation')[0][0].key.includes('cs2150')
        ).toBe(true);
    });

    it('convert key', () => {
        const catalog = window.catalog;
        const schedule = new ProposedSchedule();
        schedule.addEvent('MoFr 10:00AM - 11:30AM', true, 'title asd');
        expect(catalog.convertKey('cs11105', schedule)).toBe('CS 1110 Lecture');
        expect(catalog.convertKey('123213213', schedule)).toBe('123213213');
        expect(catalog.convertKey('MoFr 10:00AM - 11:30AM', schedule)).toBe('title asd');
    });
});
