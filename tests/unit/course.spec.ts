describe('course test', () => {
    it('basic', () => {
        const catalog = window.catalog;
        const course = catalog.getCourse('cs11105');
        expect(course.allSameTime()).toBe(false);
        expect(course.copy().equals(course)).toBe(true);
        expect(course.has(course.sections[0]));
        expect(course.has(new Set([0]), 'cs11105'));
        expect(course.equals({})).toBe(false);

        // dummy
        course.addMatch({
            match: 'key',
            start: 0,
            end: 1
        });
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
});
