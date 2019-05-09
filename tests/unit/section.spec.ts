import Section from '../../src/models/Section';
import data from './data';

describe('section test', () => {
    it('basic', async () => {
        const catalog = await data;
        const sec: Section = catalog.getSection('cs11105', 0);
        const sec2 = catalog.getSection('cs11105', 0);
        expect(sec).toBeTruthy();
        expect(sec.sameTimeAs(sec2)).toBe(true);
        expect(sec.equals(sec2)).toBe(true);
        expect(sec.hash()).toEqual(sec2.hash());

        const [time, room] = sec.getRoomTime()!;
        expect(Object.keys(time)).toEqual(Object.keys(room));
        expect(Object.values(time).reduce((acc, block) => acc + block!.length, 0)).toEqual(
            Object.values(room).reduce((acc, block) => acc + block!.length, 0) * 2
        );

        expect(sec.has(sec2));
    });
});
