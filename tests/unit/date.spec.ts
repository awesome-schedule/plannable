import { compareDate, checkDateConflict } from '@/utils/time';

describe('date test', () => {
    it('compare date', () => {
        for (let i = 0; i < 100; i++) {
            const d1 = new Date();
            const d2 = new Date(
                d1.getTime() + Math.floor(Math.random() * 5 + 1) * 24 * 60 * 60 * 1000
            );
            expect(
                compareDate(d1.getMonth() + 1, d1.getDate(), d2.getMonth() + 1, d2.getDate())
            ).toBeLessThan(0);
            expect(
                compareDate(d2.getMonth() + 1, d2.getDate(), d1.getMonth() + 1, d1.getDate())
            ).toBeGreaterThan(0);
            expect(
                compareDate(d1.getMonth() + 1, d1.getDate(), d1.getMonth() + 1, d1.getDate())
            ).toBe(0);
        }
    });
    it('check date conflict', () => {
        for (let i = 0; i < 100; i++) {
            const d1 = new Date();
            const d2 = new Date(
                d1.getTime() + Math.floor(Math.random() * 5 + 2) * 24 * 60 * 60 * 1000
            );
            const d3 = new Date(d1.getTime() + 4 * 24 * 60 * 60 * 1000);
            const d4 = new Date(d1.getTime() + 10 * 24 * 60 * 60 * 1000);

            const arr1: [number, number, number, number] =
                [d1.getMonth() + 1, d1.getDate(), d2.getMonth() + 1, d2.getDate()];
            const arr2: [number, number, number, number] =
                [d2.getMonth() + 1, d2.getDate(), d4.getMonth() + 1, d4.getDate()];

            expect(checkDateConflict(arr1, arr2)).toBe(true);
        }
    });
});
