import Event from '@/models/Event';

describe('event test', () => {
    it('basic', () => {
        const e = new Event('MoWeFr 12:00PM - 15:00PM', false);
        expect(e.toTimeDict()).toEqual({
            Mo: [12 * 60, 15 * 60],
            We: [12 * 60, 15 * 60],
            Fr: [12 * 60, 15 * 60]
        });
        expect(e.hash()).toBe(837467497);
    });
});
