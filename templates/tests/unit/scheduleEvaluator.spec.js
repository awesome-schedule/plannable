import ScheduleEvaluator from '../../src/algorithm/ScheduleEvaluator';

describe('Schedule Evaluator Test', () => {
    it('Overlap test', () => {
        expect(ScheduleEvaluator.calcOverlap(100, 200, 150, 250)).toBe(50);
        expect(ScheduleEvaluator.calcOverlap(150, 250, 100, 200)).toBe(50);
        expect(ScheduleEvaluator.calcOverlap(100, 300, 100, 200)).toBe(100);
    });
});
