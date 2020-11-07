describe('section test', () => {
    it('basic', () => {
        const catalog = window.catalog;
        const sec = catalog.getCourse('cs11105').sections[0];
        const sec2 = catalog.getCourse('cs11105').sections[0];
        expect(sec).toBeTruthy();
        expect(sec.sameTimeAs(sec2)).toBe(true);
        expect(sec.equals(sec2)).toBe(true);
        expect(sec.hash()).toEqual(sec2.hash());
        expect(sec.units).toBeTruthy();
        expect(sec.description).toBeTruthy();

        const timeRoom = sec.getTimeRoom()!;
        expect((timeRoom.length - 8) / 3).toBe(Math.floor((timeRoom.length - 8) / 3));
        expect(sec.has(sec2));

        const sec3 = catalog.getCourse('cs99993').sections[0];
        expect(sec3.valid & 0b1110).toBeTruthy();
        expect(sec3.validMsg[1]).not.toBe('Valid');
    });

    it('multiple meetings', () => {
        const catalog = window.catalog;
        const sec = catalog.getCourse('comm30105').sections[0];

        const timeRoom = sec.getTimeRoom()!;
        const num = timeRoom.length - 8;
        expect(num / 3).toBe(Math.floor(num / 3));

        const s2 = catalog.getCourse('cs99993').sections[0];
        expect(s2.getTimeRoom().length).toBe(8); // no time or room information
        expect(s2.sameTimeAs(sec)).toBe(false);
        expect(s2.displayName).toBeTruthy();
    });
});
