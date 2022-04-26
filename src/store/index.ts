/**
 * The Store module provides methods to save, retrieve and manipulate store.
 * It gathers all children modules and store their references in a single store class,
 * which is provided as a Mixin
 * @module src/store
 * @preferred
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
import { CourseStatus } from '../config';
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
import colorSchemes from '@/data/ColorSchemes';
import GeneratedSchedule from '@/models/GeneratedSchedule';

/**
 * the latest storage format of plannable
 */
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

let pendingStatusSave = 0;

function _saveStatus() {
    const currentSemester = semester.current;
    if (!currentSemester) return;
    const name = profile.current;
    const idx = profile.profiles.findIndex(p => p.name === name);
    if (profile.tokenType && profile.profiles[idx].remote) {
        if (idx !== -1 && !profile.isLatest(idx)) {
            console.log(
                'Uploading & saving of',
                name,
                'aborted due to checking out historical versions'
            );
            return;
        }
    }

    const obj: SemesterStorage = {
        name,
        modified: new Date().toJSON(),
        currentSemester,
        display,
        filter: filter.toJSON(),
        schedule: schedule.toJSON(),
        palette
    };

    const str = JSON.stringify(obj);
    localStorage.setItem(name, str);

    if (profile.tokenType && profile.profiles[idx].remote) {
        profile.uploadProfile([{ name, profile: str }]).then(msg => {
            if (msg) {
                noti.notify(msg);
            }
        });
    }

    pendingStatusSave = -1;
    console.log('status saved');
}

/**
 * save all store modules to localStorage
 * @note this function needs to be separated from the [[Store]] class because it is used in the [[schedule]] sub-module,
 * and the [[schedule]] sub-module does not have access to the [[Store]] class
 */
export function saveStatus() {
    if (pendingStatusSave !== -1) {
        window.clearTimeout(pendingStatusSave);
        console.log('cancelled pending status save');
    }
    pendingStatusSave = window.setTimeout(_saveStatus, 100);
}

interface CompareCandidate {
    schedule: GeneratedSchedule;
    /** the corresponding profile name of this schedule */
    profileName: string;
    /** index of this schedule among the generated schedules */
    index: number;
    /** index of this schedule among the proposed schedules */
    pIdx: number;
    color: string;
}

// this must be declared outside for it to be shared among components that inherit from store
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
     * Load [[Profile.current]], switch to the profile's semester.
     * Recover all store modules' states from the localStorage, and assign a correct Catalog object to `window.catalog`,
     * @note if you want to switch to other profiles, assign the profile name to [[Profile.current]] first.
     * @param force force update current semester data and load the given profile
     */
    async loadProfile(force = false) {
        if (!this.semester.semesters.length) {
            this.noti.error('No semester data! Please refresh this page');
            return;
        }

        window.scheduleEvaluator = new ScheduleEvaluator();
        let parsed: Partial<AncientStorage> | Partial<LegacyStorage> | Partial<SemesterState> = {};
        const data = localStorage.getItem(this.profile.current);
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
            this.semester.current &&
            parsed.currentSemester.id === this.semester.current.id &&
            !force
        ) {
            console.warn('Semester data loading aborted');
        } else {
            const semester = parsed.currentSemester || this.semester.semesters[0];
            if (force) this.noti.info(`Updating ${semester.name} data...`, 3600, true);
            // rare case: if a pending compute occurs after semester switch, an error may occur due to difference in semester courses
            this.schedule.cancelComputeAll();
            const msg = await this.semester.selectSemester(semester, force);
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
        this.compare.splice(0, this.compare.length);
        // update schedule global options
        Schedule.colors = colorSchemes[this.display.colorScheme].colors;
        Schedule.combineSections = this.display.combineSections;
        Schedule.multiSelect = this.display.multiSelect;

        if (this.schedule.generated) this.generateSchedules();
        else this.schedule.switchSchedule(false);

        this.schedule.recomputeAll(true); // need to compute all schedules for rendering
    }

    /**
     * @returns true if the current combination of sort options is valid, false otherwise
     */
    validateSortOptions() {
        const similarityOption = this.filter.sortOptions.sortBy.find(x => x.name === 'similarity')!;
        if (!this.filter.sortOptions.sortBy.some(x => x.enabled)) {
            this.noti.error('Filter: You must have at least one sort option!');
            return false;
        } else if (
            this.filter.sortOptions.sortBy.some(x => x.name === 'distance' && x.enabled) &&
            (!window.buildingSearcher || !window.timeMatrix)
        ) {
            this.noti.error(
                'Filter: Building list fails to load. Please disable "walking distance"'
            );
            return false;
        } else if (similarityOption.enabled && !this.filter.similarityEnabled) {
            this.noti.warn(
                'Similarity sorting is enabled, but there is no reference schedule. It will be disabled automatically.'
            );
            similarityOption.enabled = false;
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
        const msg = generator.getSchedules(this.schedule.proposedSchedule, this.filter.refSchedule);
        console.timeEnd('schedule generation');

        this.noti.notify(msg, 'info', 5, true);
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
     * @param target the semester to switch to. If null, switch to the latest semester
     */
    async selectSemester(target: SemesterJSON | null) {
        if (!this.semester.semesters.length) {
            this.noti.error('No semester data! Please refresh this page');
            return;
        }
        if (this.semester.current && target && target.id === this.semester.current.id) return;

        target = target || this.semester.semesters[0];
        this.status.loading = true;

        const { profiles } = this.profile;
        let parsed: Partial<SemesterStorage> = {};
        let parsedLatest = -Infinity;

        // find the latest profile corresponding to the semester to be switched
        for (const { name } of profiles) {
            const data = localStorage.getItem(name);
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
                        // if no modified time, only use it if no profile corresponding to this semester has been found
                        if (!parsed.currentSemester) parsed = temp;
                    }
                }
            }
        }
        // no profile for target semester exists. let's create one
        if (!parsed.currentSemester) {
            parsed.currentSemester = target;
            await profile.addProfile(
                parsed,
                target.name,
                `You already have a profile named ${target.name}. However, it does not correspond to the ${target.name} semester. Click Ok to overwrite, click Cancel to keep both.`
            );
        } else {
            // load the existing profile
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
        lz.decompressFromEncodedURIComponent(config.trim())!
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
