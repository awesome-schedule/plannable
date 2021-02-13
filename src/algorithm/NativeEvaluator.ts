/**
 * @module src/algorithm
 * @author Hanzhi Zhou, Kaiying Shan
 */

/**
 *
 */
import GeneratedSchedule from '../models/GeneratedSchedule';
import Event from '../models/Event';
import { RawAlgoCourse } from './ScheduleGenerator';
import { EvaluatorOptions, SortOption } from './ScheduleEvaluator';

// eslint-disable-next-line @typescript-eslint/no-use-before-define

/**
 * The goal of the schedule evaluator is to efficiently sort the generated schedules
 * according to the set of the rules defined by the user
 */
class ScheduleEvaluator {
    /**
     * @param options
     * @param events the array of events kept, use to construct generated schedules
     * @param classList the 2d array of (combined) sections
     */
    constructor(
        public options: Readonly<EvaluatorOptions> = { sortBy: [], mode: 0 },
        private readonly events: Event[] = [],
        private readonly classList: RawAlgoCourse[][] = [],
        private readonly Module?: typeof window.NativeModule
    ) {
        // console.log(options);
    }

    get size() {
        if (!this.Module) return 0;
        return this.Module._size();
    }

    public sort({ newOptions }: { newOptions?: EvaluatorOptions } = {}) {
        if (newOptions) this.options = newOptions;
        this.Module!._setSortMode(this.options.mode);

        // keep the order (!important!)
        for (let i = 0; i < this.options.sortBy.length; i++) {
            const option = this.options.sortBy[i];
            this.Module!._setSortOption(
                i,
                +option.enabled,
                +option.reverse,
                option.idx,
                option.weight || 1.0
            );
        }
        this.Module!._sort();
    }

    /**
     * Get a `Schedule` object at idx
     */
    public getSchedule(idx: number) {
        const Module = this.Module!;

        const ptr = Module._getSchedule(idx);
        return new GeneratedSchedule(
            Array.from(Module.HEAPU8.subarray(ptr, ptr + this.classList.length)).map(
                (choice, classNum) => this.classList[classNum][choice]
            ),
            this.events
        );
    }
    /**
     * whether this evaluator contains an empty array of schedules
     */
    public empty() {
        return this.size === 0;
    }

    public getRange(opt: SortOption) {
        if (opt.name == 'IamFeelingLucky') return 1.0;
        return this.Module!._getRange(opt.idx);
    }
}
export default ScheduleEvaluator;
