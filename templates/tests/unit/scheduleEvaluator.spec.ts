import ScheduleEvaluator, { SortOptionJSON } from '../../src/algorithm/ScheduleEvaluator';
import 'jest';
import { RawAlgoSchedule } from '../../src/algorithm/ScheduleGenerator';

const schedules: RawAlgoSchedule = [
    ['', { Mo: [100, 200] }, [1]],
    ['', { Mo: [50, 80] }, [1]],
    ['', { Mo: [350, 450] }, [1]],
    ['', { Mo: [10, 15] }, [1]],
    ['', { Tu: [500, 600, 300, 350] }, [1]],
    ['', { Tu: [250, 300, 100, 200] }, [1]]
];

describe('Schedule Evaluator Test', () => {
    it('Overlap test', () => {
        expect(ScheduleEvaluator.calcOverlap(100, 200, 150, 250)).toBe(50);
        expect(ScheduleEvaluator.calcOverlap(150, 250, 100, 200)).toBe(50);
        expect(ScheduleEvaluator.calcOverlap(100, 300, 100, 200)).toBe(100);
    });

    it('Compactness Test', () => {
        const func = ScheduleEvaluator.sortFunctions['compactness'];
        // expect(func(schedules)).toBe(35 + 20 + 150 + 300);
    });

    it('Insertion Test', () => {
        const evaluator = new ScheduleEvaluator(ScheduleEvaluator.getDefaultOptions(), []);
        evaluator.add(schedules);
        const s = evaluator.schedules[0];
        expect(s.blocks[0]).toEqual([10, 15, 50, 80, 100, 200, 350, 450]);
        expect(s.blocks[1]).toEqual([100, 200, 250, 300, 300, 350, 500, 600]);
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
