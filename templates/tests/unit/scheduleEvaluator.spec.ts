import ScheduleEvaluator from '../../src/algorithm/ScheduleEvaluator';
import 'jest';

describe('Schedule Evaluator Test', () => {
    it('Overlap test', () => {
        expect(ScheduleEvaluator.calcOverlap(100, 200, 150, 250)).toBe(50);
        expect(ScheduleEvaluator.calcOverlap(150, 250, 100, 200)).toBe(50);
        expect(ScheduleEvaluator.calcOverlap(100, 300, 100, 200)).toBe(100);
    });

    it('Compactness Test', () => {
        const func = ScheduleEvaluator.sortFunctions['compactness'];
        const schedules: import('../../src/algorithm/ScheduleGenerator').RawAlgoSchedule = [
            ['asd', { Mo: [100, 200] }, [1]],
            ['asd', { Tu: [50, 100] }, [1]]
        ];
        console.log(func(schedules));
    });
});
