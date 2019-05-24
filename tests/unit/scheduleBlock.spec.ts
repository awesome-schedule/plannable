import ScheduleBlock from '@/models/ScheduleBlock';
import Event from '@/models/Event';

describe('schedule block', () => {
    it('basic', () => {
        const block1 = new ScheduleBlock('#ffffff', '15:00', '17:00', new Event('1', false));
        const block2 = new ScheduleBlock('#ffffff', '17:00', '23:00', new Event('1', false));

        expect(+block1).toBe(120);
        expect(block1 + '').toBe('null');
        expect(block1.conflict(block2)).toBe(false);
        expect(block1.conflict(block2, true)).toBe(true);
    });
});
