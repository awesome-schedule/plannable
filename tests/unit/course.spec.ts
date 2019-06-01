import data from './data';
import Course from '@/models/Course';

beforeAll(async () => {
    window.catalog = await data;
});

describe('course test', () => {
    it('basic', () => {
        const catalog = window.catalog;
        const course = catalog.getCourse('cs11105');
        expect(course.allSameTime()).toBe(false);
        expect(course.copy().equals(course)).toBe(true);
        expect(course.has(course.sections[0]));
        expect(course.has(new Set([0]), 'cs11105'));
        expect(course.equals({})).toBe(false);
    });

    it('subset', () => {
        const catalog = window.catalog;
        const course = catalog.getCourse('cs11105', new Set([0]));
        expect(course.allSameTime()).toBe(true);
        expect(course.has(course.getFirstSection())).toBe(true);
        expect(Object.values(course.getCombined())[0][0].equals(course.getFirstSection())).toBe(
            true
        );
    });

    it('fake', () => {
        let course = new Course(undefined, 'cs11105');
        expect(course.isFake).toBe(true);
        course = new Course(undefined, 'asdasd');
        expect(course.isFake).toBe(true);

        const c = window.catalog.getCourse('cs11105').getCourse([100, 200]);
        expect(c.hasFakeSections).toBe(true);
    });
});
