import ScheduleEvaluator, { SortOptionJSON } from '../../src/algorithm/ScheduleEvaluator';
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
            ['', { Mo: [100, 200] }, [1]],
            ['', { Mo: [50, 80] }, [1]],
            ['', { Mo: [350, 450] }, [1]],
            ['', { Mo: [10, 15] }, [1]],
            ['', { Tu: [500, 600] }, [1]],
            ['', { Tu: [100, 200] }, [1]]
        ];
        expect(func(schedules)).toBe(35 + 20 + 150 + 300);
    });

    it('lunch Test', () => {
        expect(1).toBe(1);
    });

    it('Sort Option JSON Parse', () => {
        const rawSortOptions: SortOptionJSON = {
            sortBy: [
                {
                    name: 'variance',
                    enabled: false,
                    reverse: true
                }
            ],
            mode: 1
        };
        const sortOption = ScheduleEvaluator.getDefaultOptions();
        sortOption.fromJSON(rawSortOptions);
        expect(sortOption.sortBy[0].enabled).toBe(false);
        expect(sortOption.sortBy[0].reverse).toBe(true);
        expect(sortOption.mode).toBe(1);

        for (let i = 1; i < sortOption.sortBy.length; i++) {
            expect(sortOption.sortBy[i]).toEqual(ScheduleEvaluator.optionDefaults.sortBy[i]);
        }
    });
});
