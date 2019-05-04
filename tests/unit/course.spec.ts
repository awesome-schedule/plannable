import data from './data';

describe('course test', () => {
    it('basic', async () => {
        const catalog = await data;
        const course = catalog.getCourse('cs11105');
        expect(course.allSameTime()).toBe(false);
        expect(course.copy().equals(course)).toBe(true);
        expect(course.has(course.sections[0]));
        expect(course.getFirstSection()).toEqual(course.getSection(0));
        expect(course.has(new Set([0]), 'cs11105'));
    });

    it('subset', async () => {
        const catalog = await data;
        const course = catalog.getCourse('cs11105', new Set([0]));
        expect(course.allSameTime()).toBe(true);
        expect(course.has(course.getSection(1))).toBe(false);
        expect(course.has(course.getFirstSection())).toBe(true);
        expect(Object.values(course.getCombined())[0][0].equals(course.getFirstSection())).toBe(
            true
        );
    });
});
