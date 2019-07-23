import Event from '@/models/Event';

describe('event test', () => {
    it('basic', () => {
        const e = new Event('MoWeFr 12:00PM - 3:00PM', false);
        expect(e.toTimeArray()).toEqual(
            new Int16Array([8, 10, 10, 12, 12, 14, 14, 14, 720, 900, 720, 900, 720, 900])
        );
        expect(e.hash()).toBe(4247944060);
    });
});
