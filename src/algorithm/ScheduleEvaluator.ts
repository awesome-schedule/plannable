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

// eslint-disable-next-line @typescript-eslint/no-use-before-define
export type SortFunctionNames =
    | 'variance'
    | 'compactness'
    | 'lunchTime'
    | 'noEarly'
    | 'distance'
    | 'similarity'
    | 'IamFeelingLucky';

/**
 * representation of a single sort option
 */
export interface SortOption {
    /** name of this sort option*/
    readonly name: SortFunctionNames;
    /** whether or not this option is enabled */
    enabled: boolean;
    /** whether to sort in reverse */
    reverse: boolean;
    /** a unique index for this sort option */
    idx: number;
    /** the weight of this sort option, used by the combined sort mode only */
    weight: number;
}

/** enum for the two sort modes */
export enum SortMode {
    fallback = 0,
    combined = 1
}

/** options for the schedule evaluator */
export interface EvaluatorOptions {
    readonly sortBy: readonly SortOption[];
    mode: SortMode;
}
/**
 * The goal of the schedule evaluator is to efficiently sort the generated schedules
 * according to the set of the rules defined by the user
 */
class ScheduleEvaluator {
    private _refSchedule!: GeneratedSchedule['All'];
    /**
     * @param options
     * @param events the array of events kept, use to construct generated schedules
     * @param classList the 2d array of (combined) sections
     */
    constructor(
        public options: Readonly<EvaluatorOptions> = { sortBy: [], mode: 0 },
        private readonly events: Event[] = [],
        private readonly classList: RawAlgoCourse[][] = [],
        refSchedule: GeneratedSchedule['All'] = {},
        private readonly Module?: typeof window.NativeModule
    ) {
        this.refSchedule = refSchedule;
    }

    get size() {
        if (!this.Module) return 0;
        return this.Module._size();
    }

    get refSchedule() {
        return this._refSchedule;
    }

    set refSchedule(refSchedule: GeneratedSchedule['All']) {
        this._refSchedule = refSchedule;

        // don't do anything if this is an empty evaluator or the ref schedule is set to empty
        if (!this.Module || Object.keys(refSchedule).length === 0) return;

        const numCourses = this.classList.length;
        const ptr = this.Module!._malloc(numCourses);
        const refScheduleEncoded = this.Module.HEAPU8.subarray(ptr, ptr + numCourses).fill(255);
        for (const key in refSchedule) {
            const refSecs = refSchedule[key].map(x => x.keys().next().value);
            for (let i = 0; i < this.classList.length; i++) {
                const secs = this.classList[i];
                for (let j = 0; j < secs.length; j++) {
                    if (secs[j][0] === key && refSecs.some(id => secs[j][1].includes(id))) {
                        refScheduleEncoded[i] = j;
                        break;
                    }
                }
            }
        }
        this.Module._setRefSchedule(ptr);
    }

    public sort({ newOptions }: { newOptions?: EvaluatorOptions } = {}) {
        if (!this.Module) return;

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
        if (!this.Module) return 1.0;
        if (opt.name == 'IamFeelingLucky') return 1.0;
        return this.Module!._getRange(opt.idx);
    }
}
export default ScheduleEvaluator;
