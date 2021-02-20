import { EvaluatorOptions } from '@/algorithm/ScheduleEvaluator';
import filter from '@/store/filter';

describe('Schedule Evaluator Test', () => {
    it('Sort Option JSON Parse', () => {
        const rawSortOptions: EvaluatorOptions = {
            sortBy: [
                {
                    name: 'distance',
                    enabled: false,
                    reverse: true,
                    idx: 1,
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
