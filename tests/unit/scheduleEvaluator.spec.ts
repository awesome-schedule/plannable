import ScheduleEvaluator, { EvaluatorOptions } from '@/algorithm/ScheduleEvaluator';
import filter from '@/store/filter';
import { computeTimeArrLens, timeArrayToCompact } from '@/algorithm/ScheduleGenerator';

test('dummy', () => {
    expect(1).toBe(1);
});

const d1 = new Date('2019/8/28').getTime();
const d2 = new Date('2019/12/7').getTime();

const timeArrayList = [
    ['1', [1], new Int16Array([8, 11, 11, 11, 11, 11, 11, 11, 100, 200, -1]), [d1, d2]] as const,
    ['2', [1], new Int16Array([8, 11, 11, 11, 11, 11, 11, 11, 50, 80, -1]), [d1, d2]] as const,
    ['3', [1], new Int16Array([8, 11, 11, 11, 11, 11, 11, 11, 350, 450, -1]), [d1, d2]] as const,
    ['4', [1], new Int16Array([8, 11, 11, 11, 11, 11, 11, 11, 10, 15, -1]), [d1, d2]] as const,
    [
        '5',
        [1],
        new Int16Array([8, 8, 14, 11, 11, 11, 11, 11, 500, 600, -1, 300, 350, -1]),
        [d1, d2]
    ] as const,
    [
        '6',
        [1],
        new Int16Array([8, 8, 14, 11, 11, 11, 11, 11, 250, 300, -1, 100, 200, -1]),
        [d1, d2]
    ] as const
].map(x => [x[2]]);

const timeArrLens = new Uint8Array(6);
computeTimeArrLens(timeArrayList, timeArrLens);

const evaluator = new ScheduleEvaluator(
    filter.sortOptions,
    window.timeMatrix,
    undefined,
    new Array(6),
    new Uint8Array(6),
    undefined,
    timeArrayToCompact(timeArrayList, timeArrLens),
    1,
    timeArrLens.reduce((acc, x) => acc + x - 8, 8)
);
describe('Schedule Evaluator Test', () => {
    it('Compactness Test', () => {
        const func = ScheduleEvaluator.sortFunctions.compactness;
        expect(func(evaluator['blocks'], 0)).toBe(35 + 20 + 150 + 50 + 0 + 150);
    });

    it('Insertion Test', () => {
        expect(Array.from(evaluator['blocks'].slice(8, 20))).toEqual([
            10,
            15,
            -1,
            50,
            80,
            -1,
            100,
            200,
            -1,
            350,
            450,
            -1
        ]);
        expect(Array.from(evaluator['blocks'].slice(20))).toEqual([
            100,
            200,
            -1,
            250,
            300,
            -1,
            300,
            350,
            -1,
            500,
            600,
            -1
        ]);
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
                    reverse: true,
                    weight: 1
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
