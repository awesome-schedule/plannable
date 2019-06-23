import Schedule from '@/models/Schedule';

describe('catalog test', () => {
    it('search', () => {
        const catalog = window.catalog;
        expect(catalog.search('comp. visio').length).toBeGreaterThanOrEqual(1);
        expect(catalog.search('cs', 6).length).toBe(6);
        expect(catalog.search('asdasdasajkgwuoeisd').length).toBe(0);
        expect(catalog.search('john').length).toBeGreaterThan(2);
        expect(catalog.search('aaron bloomf').length).toBeGreaterThan(2);
        expect(catalog.search('discre').length).toBeGreaterThan(1);
        expect(catalog.search('quantum').length).toBeGreaterThan(1);

        expect(catalog.search(':desc a').length).toBeGreaterThan(1);
        expect(catalog.search(':prof asdasdasdasdasdasdsad').length).toBe(0);
    });

    it('convert key', () => {
        const catalog = window.catalog;
        const schedule = new Schedule();
        schedule.addEvent('MoFr 10:00AM - 11:30AM', true, 'title asd');
        expect(catalog.convertKey('cs11105', schedule)).toBe('CS 1110 Lecture');
        expect(catalog.convertKey('123213213', schedule)).toBe('123213213');
        expect(catalog.convertKey('MoFr 10:00AM - 11:30AM', schedule)).toBe('title asd');
    });

    it('json', () => {
        const catalog = window.catalog;
        expect(catalog.fromJSON(catalog.toJSON()).raw_data).toEqual(catalog.raw_data);
    });

    it('other', () => {
        try {
            window.catalog.getSection('asdasdasdasdas', 1);
        } catch (e) {
            expect(e.message).toBeTruthy();
        }
        try {
            window.catalog.initWorker();
        } catch (e) {
            // module not found
        }
        window.catalog.disposeWorker();
    });
});
