import Event from '@/models/Event';
import ScheduleBlock from '@/models/ScheduleBlock';
import { hr24toInt } from '@/utils';

describe('schedule block', () => {
    it('basic', () => {
        const block1 = new ScheduleBlock(
            '#ffffff',
            new Event('1', false),
            hr24toInt('15:00'),
            hr24toInt('17:00')
        );
        const block2 = new ScheduleBlock(
            '#ffffff',
            new Event('1', false),
            hr24toInt('17:00'),
            hr24toInt('23:00')
        );

        expect(block1.duration).toBe(120);
        expect(block1.conflict(block2)).toBe(false);
        expect(block1.conflict(block2, true)).toBe(true);
    });
});
