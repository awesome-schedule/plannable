/**
 * @module store
 */

/**
 *
 */
import lz from 'lz-string';

import Expirable from '@/data/Expirable';
import { Component, Vue } from 'vue-property-decorator';
import ScheduleEvaluator, { EvaluatorOptions } from '../algorithm/ScheduleEvaluator';
import ScheduleGenerator, { GeneratorOptions } from '../algorithm/ScheduleGenerator';
import { SemesterJSON } from '../models/Catalog';
import { CourseStatus } from '../models/Meta';
import Schedule, { ScheduleJSON } from '../models/Schedule';
import display, { Display, DisplayState } from './display';
import filter, { FilterStateJSON, FilterStore, TimeSlot } from './filter';
import modal from './modal';
import noti from './notification';
import palette, { Palette, PaletteState } from './palette';
import profile from './profile';
import schedule, { ScheduleStateJSON, ScheduleStore } from './schedule';
import semester, { SemesterState } from './semester';
import status from './status';

export interface SemesterStorage extends Expirable {
    name: string;
    currentSemester: SemesterJSON;
    display: DisplayState;
    filter: FilterStateJSON;
    schedule: ScheduleStateJSON;
    palette: PaletteState;
}

interface LegacyScheduleJSON extends ScheduleJSON {
    savedColors: { [x: string]: string };
}

/**
 * the storage format prior to v4.5
 */
interface LegacyStorage {
    currentSemester: SemesterJSON;
    currentScheduleIndex: number;
    proposedScheduleIndex: number;
    cpIndex: number;
    currentSchedule: LegacyScheduleJSON;
    proposedSchedules: LegacyScheduleJSON[];

    display: DisplayState;

    timeSlots: TimeSlot[];
    allowWaitlist: boolean;
    allowClosed: boolean;
    sortOptions: EvaluatorOptions;
}

/**
 * the storage format prior to v3.0
 */
interface AncientStorage extends DisplayState {
    currentSemester: SemesterJSON;
    currentScheduleIndex: number;
    currentSchedule: LegacyScheduleJSON;
    proposedSchedule: LegacyScheduleJSON;

    timeSlots: TimeSlot[];
    allowWaitlist: boolean;
    allowClosed: boolean;
    sortOptions: EvaluatorOptions;
}

interface StorageItem<State, JSONState> {
    /**
     * a method to obtain the default state
     */
    getDefault(): State;
    /**
     * serialize `this` (the store module) to its JSON representation
     */
    toJSON(this: StoreModule<State, JSONState>): JSONState;
    /**
     * recover the state from its JSON representation
     *
     * An object that has all or some properties of the `JSONState` will be passed as a parameter.
     * The missing properties will be assigned with the value returned by the `getDefault` method.
     */
    fromJSON(obj: Partial<JSONState>): void;
}

/**
 * A Store Module must have
 * @typeparam State
 * @typeparam JSONState the JSON representation of its state
 *
 * and the three methods defined by [[StorageItem]]
 */
export type StoreModule<State, JSONState> = State & StorageItem<State, JSONState>;

function isAncient(parsed: any): parsed is AncientStorage {
    return !!parsed.currentSchedule && !!parsed.proposedSchedule;
}

function isLegacy(parsed: any): parsed is LegacyStorage {
    return !!parsed.currentSchedule && !!parsed.proposedSchedules;
}

export function saveStatus() {
    const { currentSemester } = semester;
    if (!currentSemester) return;
    const name = profile.current;

    const obj: SemesterStorage = {
        name,
        modified: new Date().toJSON(),
        currentSemester,
        display,
        filter: filter.toJSON(),
        schedule: schedule.toJSON(),
        palette
    };

    localStorage.setItem(name, JSON.stringify(obj));
    console.log('status saved');
}

interface CompareCandidate {
    schedule: Schedule;
    profileName: string;
    /**
     * index of the generated schedule
     */
    index: number;
    /**
     * index of proposed schedule
     */
    pIdx: number;
    color: string;
}

const compare: CompareCandidate[] = [];
/**
 * The Store module provides methods to save, retrieve and manipulate store.
 * It gathers all children modules and store their references in a single store class, which is provided as a Mixin
 * @noInheritDoc
 */
@Component
export default class Store extends Vue {
    filter = filter;
    display = display;
    status = status;
    modal = modal;
    schedule = schedule;
    semester = semester;
    palette = palette;
    noti = noti;
    profile = profile;
    compare = compare;

    /**
     * save all store modules to localStorage
     */
    saveStatus() {
        saveStatus();
    }

    /**
     * given the profile name, switch to the profile's semester.
     * recover all store modules' states from the localStorage,
     * and assign a correct Catalog object to `window.catalog`,
     * @param name
     * @param force force update current semester data and load the given profile
     */
    async loadProfile(name?: string, force = false) {
        if (!this.semester.semesters.length) {
            this.noti.error('No semester data! Please refresh this page');
            return;
        }
        if (!name) name = this.profile.current;

        window.scheduleEvaluator = new ScheduleEvaluator();
        let parsed: Partial<AncientStorage> | Partial<LegacyStorage> | Partial<SemesterState> = {};
        const data = localStorage.getItem(name);
        if (data) {
            try {
                parsed = JSON.parse(data);
            } catch (e) {
                console.error(e);
            }
        }

        // do not re-select current semester if it is already selected and this is not a force-update
        if (
            parsed.currentSemester &&
            this.semester.currentSemester &&
            parsed.currentSemester.id === this.semester.currentSemester.id &&
            !force
        ) {
            console.warn('Semester data loading aborted');
        } else {
            const msg = await this.semester.selectSemester(
                parsed.currentSemester || this.semester.semesters[0],
                force
            );
            this.noti.notify(msg);
            if (!msg.payload) return;
        }

        if (isAncient(parsed)) {
            const ancient: AncientStorage = parsed || {};
            const oldStore: Partial<LegacyStorage> & AncientStorage = ancient;
            oldStore.proposedScheduleIndex = 0;
            oldStore.proposedSchedules = [oldStore.proposedSchedule];
            this.display.fromJSON(oldStore);
            this.filter.fromJSON(oldStore);
            this.schedule.fromJSON(oldStore);
            this.palette.fromJSON(oldStore.currentSchedule || { savedColors: {} });
        } else if (isLegacy(parsed)) {
            this.display.fromJSON(parsed.display || {});
            this.filter.fromJSON(parsed);
            this.schedule.fromJSON(parsed);
            this.palette.fromJSON(parsed.currentSchedule || { savedColors: {} });
        } else {
            const newStore = parsed as SemesterStorage;
            this.display.fromJSON(newStore.display || {});
            this.filter.fromJSON(newStore.filter || {});
            this.schedule.fromJSON(newStore.schedule || {});
            this.palette.fromJSON(newStore.palette || {});
        }
        Schedule.options.colorScheme = this.display.colorScheme;
        Schedule.options.combineSections = this.display.combineSections;
        Schedule.options.multiSelect = this.display.multiSelect;
        this.schedule.recomputeAll();
        if (this.schedule.generated) this.generateSchedules();
        else this.schedule.switchSchedule(false);
    }

    /**
     * @returns true if the current combination of sort options is valid, false otherwise
     */
    validateSortOptions() {
        if (!Object.values(this.filter.sortOptions.sortBy).some(x => x.enabled)) {
            this.noti.error('Filter: You must have at least one sort option!');
            return false;
        } else if (
            Object.values(this.filter.sortOptions.sortBy).some(
                x => x.name === 'distance' && x.enabled
            ) &&
            (!window.buildingSearcher || !window.timeMatrix)
        ) {
            this.noti.error(
                'Filter: Building list fails to load. Please disable "walking distance"'
            );
            return false;
        }
        return true;
    }

    /**
     * convert filter to generator options
     */
    getGeneratorOptions(): GeneratorOptions | void {
        const filteredStatus: CourseStatus[] = [];
        if (!this.filter.allowWaitlist) filteredStatus.push('Wait List');
        if (!this.filter.allowClosed) filteredStatus.push('Closed');

        const msg = this.filter.computeFilter();
        const timeSlots = msg.payload;
        if (!timeSlots) return this.noti.notify(msg);

        if (!this.validateSortOptions()) return;

        return {
            timeSlots,
            status: filteredStatus,
            sortOptions: this.filter.sortOptions,
            combineSections: this.display.combineSections,
            maxNumSchedules: this.display.maxNumSchedules
        };
    }

    generateSchedules() {
        this.status.foldView();

        if (this.schedule.proposedSchedule.empty())
            return this.noti.warn(`There are no classes in your schedule!`) as undefined;
        const options = this.getGeneratorOptions();
        if (!options) return;

        const generator = new ScheduleGenerator(window.catalog, window.timeMatrix, options);

        console.time('schedule generation');
        const msg = generator.getSchedules(
            this.schedule.proposedSchedule,
            true,
            this.filter.refSchedule
        );
        console.timeEnd('schedule generation');

        this.noti.notify(msg, 'info', 3, true);
        const evaluator = msg.payload;
        if (evaluator) {
            window.scheduleEvaluator = evaluator;
            this.schedule.numGenerated = evaluator.size;
            this.schedule.cpIndex = this.schedule.proposedScheduleIndex;
            this.schedule.switchSchedule(true);
        } else {
            window.scheduleEvaluator = new ScheduleEvaluator();
            this.schedule.switchSchedule(false);
            this.schedule.cpIndex = -1;
            this.schedule.numGenerated = 0;
        }
        return evaluator;
    }

    /**
     * Select a semester and fetch all its associated data,
     * note that the first profile corresponding to the target semester will be loaded.
     *
     * @param target the semester to switch to
     * @param force whether to force-update semester data
     */
    async selectSemester(target: SemesterJSON | null | undefined, force = false) {
        if (!this.semester.semesters.length) {
            this.noti.error('No semester data! Please refresh this page');
            return;
        }
        this.status.loading = true;
        if (!target) target = this.semester.semesters[0];

        if (force) {
            this.noti.info(`Updating ${target.name} data...`, 3600, true);
            await this.loadProfile(this.profile.current, force);
            this.status.loading = false;
            return;
        } else if (
            this.semester.currentSemester &&
            target.id === this.semester.currentSemester.id
        ) {
            this.status.loading = false;
            return;
        }

        const { profiles } = this.profile;
        let parsed: Partial<SemesterStorage> = {};
        let parsedLatest = -Infinity;

        // find the latest profile corresponding to the semester to be switched
        for (const profileName of profiles) {
            const data = localStorage.getItem(profileName);
            if (data) {
                const temp: Partial<SemesterStorage> = JSON.parse(data);
                const { currentSemester, modified } = temp;
                if (currentSemester && currentSemester.id === target.id) {
                    if (modified) {
                        const time = new Date(modified).getTime();
                        if (time > parsedLatest) {
                            parsed = temp;
                            parsedLatest = time;
                        }
                    } else {
                        if (!parsed.currentSemester) parsed = temp;
                    }
                }
            }
        }
        // no profile for target semester exists. let's create one
        if (!parsed.currentSemester) {
            const { name } = target;
            if (profiles.includes(name)) {
                if (
                    !confirm(
                        `You already have a profile named ${name}. However, it does not correspond to the ${name} semester. Click Ok to overwrite, click Cancel to keep both.`
                    )
                ) {
                    let idx = 2;
                    while (profiles.includes(`${name} (${idx})`)) idx++;
                    profiles.push(`${name} (${idx})`);
                }
            } else {
                profiles.push(name);
            }
            parsed.currentSemester = target;
            this.profile.current = parsed.name = name;
            localStorage.setItem(name, JSON.stringify(parsed));
        } else {
            this.profile.current = parsed.name!;
        }
        await this.loadProfile();
        this.status.loading = false;
    }
}

/**
 * See [[parseFromURL]]
 * convert JSON string to tuple of tuples to reduce the num of chars
 * @author Zichao Hu
 * @param jsonString
 */
export function compressJSON(jsonString: string) {
    const { name, modified, currentSemester, display, filter, schedule, palette } = JSON.parse(
        jsonString
    ) as SemesterStorage;

    return [
        name,
        modified,
        currentSemester.id,
        currentSemester.name,
        Display.compressJSON(display),
        FilterStore.compressJSON(filter),
        ScheduleStore.compressJSON(schedule),
        Palette.compressJSON(palette)
    ] as const;
}

/**
 * @author Zichao Hu, Hanzhi Zhou
 * @param config
 * @note JSON decompression requires the catalog of the semester to be pre-loaded,
 * because the reference schedule conversion in filter requires it
 */
export async function parseFromURL(config: string): Promise<SemesterStorage> {
    // get URL and convert to JSON
    const data: ReturnType<typeof compressJSON> = JSON.parse(
        lz.decompressFromEncodedURIComponent(config.trim())
    );
    const currentSemester = { id: data[2], name: data[3] };
    await semester.selectSemester(currentSemester);
    return {
        name: data[0],
        modified: data[1],
        currentSemester,
        display: Display.decompressJSON(data[4]),
        filter: FilterStore.decompressJSON(data[5]),
        schedule: ScheduleStore.decompressJSON(data[6]),
        palette: Palette.decompressJSON(data[7])
    };
}
