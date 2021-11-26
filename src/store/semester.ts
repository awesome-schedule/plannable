/**
 * @module src/store
 */

/**
 *
 */
import { fallback } from '@/data/Loader';
import { loadSemesterList } from '@/data/SemesterListLoader';
import { CancelablePromise } from '@/utils';
import { loadSemesterData } from '../data/CatalogLoader';
import Catalog, { SemesterJSON } from '../models/Catalog';

export interface SemesterState {
    [x: string]: any;
    semesters: SemesterJSON[];
    current: SemesterJSON | null;
    lastUpdate: string;
}

/**
 * the semester module handles semester switching and data retrieval
 * @author Hanzhi Zhou
 */
class Semesters implements SemesterState {
    semesters: SemesterJSON[] = [];
    current: SemesterJSON | null = null; // cannot use undefined here, otherwise we will lose reactivity
    lastUpdate = '';
    pendingPromise: CancelablePromise<Catalog> | null = null;

    /**
     * load the list of semesters
     */
    async loadSemesters(count = 10) {
        const result = await loadSemesterList(count);
        this.semesters = result.payload || [];
        return result;
    }

    /**
     * cancel the pendingPromise
     */
    cancel() {
        const p = this.pendingPromise;
        if (p) p.cancel('Canceled');
    }

    /**
     * DO NOT call this method. call [[Store.selectSemester]] instead.
     */
    async selectSemester(currentSemester: SemesterJSON, force = false) {
        const temp = await loadSemesterData(currentSemester, force);

        // allow one to cancel the pending promise if old data exists
        if (temp.old) this.pendingPromise = temp.new;

        const { name } = currentSemester;
        const result = await fallback(temp, {
            errMsg: x => `Failed to fetch ${name} data: ${x}`,
            warnMsg: x => `Failed to fetch ${name} data: ${x}. Old data is used`,
            succMsg: `Successfully loaded ${name} data!`,
            timeoutTime: 1500000
        });
        //  if the a catalog object is returned
        if (result.payload) {
            window.catalog = result.payload;
            this.current = currentSemester;
            this.lastUpdate = new Date(window.catalog.modified).toLocaleString();
        } else {
            this.current = null;
            this.lastUpdate = '';
        }
        this.pendingPromise = null;
        return result;
    }
}

export default new Semesters();
