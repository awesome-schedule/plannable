describe('course test', () => {
    it('basic', () => {
        const catalog = window.catalog;
        const course = catalog.getCourse('cs11105');
        expect(course.allSameTime()).toBe(false);
        expect(course.has(course.sections[0]));
        expect(course.has(new Set([course.sections[0].id]), 'cs11105'));
        expect(course.equals({})).toBe(false);
        expect(course.equals(course)).toBe(true);
    });

    it('subset', () => {
        const catalog = window.catalog;
        const c = catalog.getCourse('cs11105');
        const course = catalog.getCourse('cs11105', new Set([c.sections[0].id]));
        expect(course.allSameTime()).toBe(true);
    });
});
