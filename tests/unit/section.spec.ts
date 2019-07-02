import Section from '@/models/Section';

describe('section test', () => {
    it('basic', () => {
        const catalog = window.catalog;
        const sec: Section = catalog.getSection('cs11105', 0);
        const sec2 = catalog.getSection('cs11105', 0);
        expect(sec).toBeTruthy();
        expect(sec.sameTimeAs(sec2)).toBe(true);
        expect(sec.equals(sec2)).toBe(true);
        expect(sec.hash()).toEqual(sec2.hash());

        const timeRoom = sec.getTimeRoom()!;
        const num = Object.values(timeRoom).reduce((acc, block) => acc + block!.length, 0);
        expect(num / 3).toBe(Math.floor(num / 3));
        expect(sec.has(sec2));
    });

    it('multiple meetings', () => {
        const catalog = window.catalog;
        const sec: Section = catalog.getSection('comm30105', 0);

        const timeRoom = sec.getTimeRoom()!;
        const num = Object.values(timeRoom).reduce((acc, block) => acc + block!.length, 0);
        expect(num / 3).toBe(Math.floor(num / 3));

        const s2: Section = catalog.getSection('cs99993', 0);
        expect(s2.getTimeRoom()).toBe(null);
        expect(s2.sameTimeAs(sec)).toBe(false);
        expect(s2.displayName).toBeTruthy();
    });
});
