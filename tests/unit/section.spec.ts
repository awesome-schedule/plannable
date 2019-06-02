import Section from '@/models/Section';
import data from './data';
import Course from '@/models/Course';

beforeAll(async () => {
    window.catalog = await data;
});

describe('section test', () => {
    it('basic', () => {
        const catalog = window.catalog;
        const sec: Section = catalog.getSection('cs11105', 0);
        const sec2 = catalog.getSection('cs11105', 0);
        expect(sec).toBeTruthy();
        expect(sec.sameTimeAs(sec2)).toBe(true);
        expect(sec.equals(sec2)).toBe(true);
        expect(sec.hash()).toEqual(sec2.hash());

        const [time, room] = sec.getTimeRoom()!;
        expect(Object.keys(time)).toEqual(Object.keys(room));
        expect(Object.values(time).reduce((acc, block) => acc + block!.length, 0)).toEqual(
            Object.values(room).reduce((acc, block) => acc + block!.length, 0) * 2
        );

        expect(sec.has(sec2));
    });

    it('multiple meetings', () => {
        const catalog = window.catalog;
        const sec: Section = catalog.getSection('comm30105', 0);

        const [time, room] = sec.getTimeRoom()!;
        expect(Object.keys(time)).toEqual(Object.keys(room));
        expect(Object.values(time).reduce((acc, block) => acc + block!.length, 0)).toEqual(
            Object.values(room).reduce((acc, block) => acc + block!.length, 0) * 2
        );

        const s2: Section = catalog.getSection('cs99993', 0);
        expect(s2.getTimeRoom()).toBe(null);
        expect(s2.sameTimeAs(sec)).toBe(false);
        expect(s2.displayName).toBeTruthy();
    });
});
