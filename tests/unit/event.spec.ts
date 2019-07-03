import Event from '@/models/Event';

describe('event test', () => {
    it('basic', () => {
        const e = new Event('MoWeFr 12:00PM - 3:00PM', false);
        expect(e.toTimeArray()).toEqual([
            [12 * 60, 15 * 60],
            [],
            [12 * 60, 15 * 60],
            [],
            [12 * 60, 15 * 60]
        ]);
        expect(e.hash()).toBe(4247944060);
    });
});
