import ScheduleEvaluator, {
    SortOptionJSON,
    CmpSchedule
} from '../../src/algorithm/ScheduleEvaluator';
import 'jest';
import { RawAlgoSchedule } from '../../src/algorithm/ScheduleGenerator';

const schedules: RawAlgoSchedule = [
    ['1', { Mo: [100, 200] }, [1], { Mo: [-1] }],
    ['2', { Mo: [50, 80] }, [1], { Mo: [-1] }],
    ['3', { Mo: [350, 450] }, [1], { Mo: [-1] }],
    ['4', { Mo: [10, 15] }, [1], { Mo: [-1] }],
    ['5', { Tu: [500, 600, 300, 350] }, [1], { Tu: [-1, -1] }],
    ['6', { Tu: [250, 300, 100, 200] }, [1], { Tu: [-1, -1] }]
];

describe('Schedule Evaluator Test', () => {
    it('Overlap test', () => {
        expect(ScheduleEvaluator.calcOverlap(100, 200, 150, 250)).toBe(50);
        expect(ScheduleEvaluator.calcOverlap(150, 250, 100, 200)).toBe(50);
        expect(ScheduleEvaluator.calcOverlap(100, 300, 100, 200)).toBe(100);
    });

    it('Compactness Test', () => {
        const evaluator = new ScheduleEvaluator(ScheduleEvaluator.getDefaultOptions(), []);
        evaluator.add(schedules);
        const s = evaluator._schedules[0];
        const func = ScheduleEvaluator.sortFunctions['compactness'];
        expect(func(s)).toBe(35 + 20 + 150 + 50 + 0 + 150);
    });

    it('Insertion Test', () => {
        const evaluator = new ScheduleEvaluator(ScheduleEvaluator.getDefaultOptions(), []);
        evaluator.add(schedules);
        const s = evaluator._schedules[0];
        expect(s.blocks[0]).toEqual([10, 15, 50, 80, 100, 200, 350, 450]);
        expect(s.blocks[1]).toEqual([100, 200, 250, 300, 300, 350, 500, 600]);
    });

    it('lunch Test', () => {
        expect(1).toBe(1);
    });

    it('variance test', () => {
        const cmpSchedule: CmpSchedule = {
            schedule: [
                ['mubd26205', { Tu: [1080, 1220], Th: [1080, 1220], Fr: [1080, 1220] }, [0], {}],
                ['psyc32405', { Mo: [600, 650], We: [600, 650], Fr: [600, 650] }, [0], {}],
                ['cs21025', { Tu: [570, 645], Th: [570, 645] }, [0], {}],
                ['stat20205', { Mo: [840, 915], We: [840, 915] }, [0], {}],
                ['cs21105', { Mo: [540, 590], We: [540, 590], Fr: [540, 590] }, [0], {}],
                ['cs21104', { Mo: [1020, 1125] }, [0, 4], {}],
                ['stat20204', { Tu: [1020, 1070] }, [0], {}],
                ['fren20105', { Mo: [660, 710], We: [660, 710], Fr: [660, 710] }, [1], {}]
            ],
            blocks: [
                [540, 590, 600, 650, 660, 710, 840, 915, 1020, 1125],
                [570, 645, 1020, 1070, 1080, 1220],
                [540, 590, 600, 650, 660, 710, 840, 915],
                [570, 645, 1080, 1220],
                [540, 590, 600, 650, 660, 710, 1080, 1220]
            ],
            rooms: [[], [], [], [], []],
            coeff: 1790,
            index: 0
        };
        expect(ScheduleEvaluator.sortFunctions.variance(cmpSchedule)).toBe(1790);
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
