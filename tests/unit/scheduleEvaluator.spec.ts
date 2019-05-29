import ScheduleEvaluator, { EvaluatorOptions } from '@/algorithm/ScheduleEvaluator';
import { RawAlgoSchedule } from '@/algorithm/ScheduleGenerator';
import filter from '@/store/filter';

const schedules: RawAlgoSchedule = [
    ['1', [[100, 200], [], [], [], []], [1], [[-1], [], [], [], []]],
    ['2', [[50, 80], [], [], [], []], [1], [[-1], [], [], [], []]],
    ['3', [[350, 450], [], [], [], []], [1], [[-1], [], [], [], []]],
    ['4', [[10, 15], [], [], [], []], [1], [[-1], [], [], [], []]],
    ['5', [[], [500, 600, 300, 350], [], [], []], [1], [[], [-1], [], [], []]],
    ['6', [[], [250, 300, 100, 200], [], [], []], [1], [[], [-1], [], [], []]]
];

describe('Schedule Evaluator Test', () => {
    it('Compactness Test', () => {
        const evaluator = new ScheduleEvaluator(filter.sortOptions, []);
        evaluator.add(schedules);
        const s = evaluator._schedules[0];
        const func = ScheduleEvaluator.sortFunctions.compactness;
        expect(func(s)).toBe(35 + 20 + 150 + 50 + 0 + 150);
    });

    it('Insertion Test', () => {
        const evaluator = new ScheduleEvaluator(filter.sortOptions, []);
        evaluator.add(schedules);
        const s = evaluator._schedules[0];
        expect(s.blocks[0]).toEqual([10, 15, 50, 80, 100, 200, 350, 450]);
        expect(s.blocks[1]).toEqual([100, 200, 250, 300, 300, 350, 500, 600]);
    });

    it('lunch Test', () => {
        expect(1).toBe(1);
    });

    it('Sort Option JSON Parse', () => {
        const rawSortOptions: EvaluatorOptions = {
            sortBy: [
                {
                    name: 'distance',
                    enabled: false,
                    reverse: true
                }
            ],
            mode: 1
        };
        const sortOption = filter.sortOptions;
        sortOption.fromJSON(rawSortOptions);
        expect(sortOption.sortBy[0].enabled).toBe(false);
        expect(sortOption.sortBy[0].reverse).toBe(true);
        expect(sortOption.mode).toBe(1);
        const optionDefaults = filter.sortOptions;
        for (let i = 1; i < sortOption.sortBy.length; i++) {
            expect(sortOption.sortBy[i]).toEqual(optionDefaults.sortBy[i]);
        }
    });
});

describe('1', () => {
    it('2', () => {
        expect(1).toBe(1);
    });
});
