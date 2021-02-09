import Event from '@/models/Event';
import ScheduleBlock from '@/models/ScheduleBlock';
import { hr24toInt } from '@/utils';

describe('schedule block', () => {
    it('basic', () => {
        const block1 = new ScheduleBlock(
            '#ffffff',
            hr24toInt('15:00'),
            hr24toInt('17:00'),
            new Event('1', false)
        );
        const block2 = new ScheduleBlock(
            '#ffffff',
            hr24toInt('17:00'),
            hr24toInt('23:00'),
            new Event('1', false)
        );
    });
});
