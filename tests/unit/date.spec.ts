import { checkDateConflict } from '@/utils/time';

describe('date test', () => {
    it('check date conflict', () => {
        for (let i = 0; i < 30; i++) {
            const d1 = new Date();
            const d2 = new Date(
                d1.getTime() + Math.floor(Math.random() * 2 + 6) * 24 * 60 * 60 * 1000
            );
            const d3 = new Date(d1.getTime() + 5 * 24 * 60 * 60 * 1000);
            const d4 = new Date(d1.getTime() + 10 * 24 * 60 * 60 * 1000);

            const arr1: [number, number] =
                [d1.getTime(), d2.getTime()];
            const arr2: [number, number] =
                [d3.getTime(), d4.getTime()];

            expect(checkDateConflict(arr1, arr2)).toBe(true);
            expect(checkDateConflict(arr2, arr1)).toBe(true);

            const arr3: [number, number] = [d1.getTime(), d3.getTime()];
            const arr4: [number, number] = [d2.getTime(), d4.getTime()];

            expect(checkDateConflict(arr3, arr4)).toBe(false);
        }
    });
});
