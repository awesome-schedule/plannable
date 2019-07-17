import { checkDateConflict } from '@/utils/time';

describe('date test', () => {
    it('check date conflict', () => {
        for (let i = 0; i < 100; i++) {
            const d1 = new Date();
            const d2 = new Date(
                d1.getTime() + Math.floor(Math.random() * 5 + 2) * 24 * 60 * 60 * 1000
            );
            const d3 = new Date(d1.getTime() + 4 * 24 * 60 * 60 * 1000);
            const d4 = new Date(d1.getTime() + 10 * 24 * 60 * 60 * 1000);

            const arr1: [number, number] =
                [d1.getTime(), d2.getTime()];
            const arr2: [number, number] =
                [d3.getTime(), d4.getTime()];

            expect(checkDateConflict(arr1, arr2)).toBe(true);
        }
    });
});
