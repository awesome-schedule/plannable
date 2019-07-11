/**
 * @module store
 */
import { loadSemesterData } from '../data/CatalogLoader';
import Catalog, { SemesterJSON } from '../models/Catalog';
import { fallback } from '@/data/Loader';
import { CancelablePromise } from '@/utils';
import { loadSemesterList } from '@/data/SemesterListLoader';

export interface SemesterState {
    [x: string]: any;
    semesters: SemesterJSON[];
    currentSemester: SemesterJSON | null;
    lastUpdate: string;
}

/**
 * the semester module handles semester switching and data retrieval
 * @author Hanzhi Zhou
 */
class Semesters implements SemesterState {
    semesters: SemesterJSON[] = [];
    currentSemester: SemesterJSON | null = null;
    lastUpdate: string = '';
    pendingPromise: CancelablePromise<Catalog> | null = null;

    /**
     * load the list of semesters
     */
    async loadSemesters() {
        const result = await loadSemesterList();
        const semesters = result.payload;
        if (semesters) {
            this.semesters = semesters;
        } else {
            this.semesters = [];
        }

        return result;
    }

    /**
     * DO NOT call this method. call [[Store.selectSemester]] instead.
     */
    async selectSemester(currentSemester: SemesterJSON, force: boolean = false) {
        const temp = loadSemesterData(currentSemester, force);
        this.pendingPromise = temp.new;

        const result = await fallback(temp);
        //  if the a catalog object is returned
        if (result.payload) {
            window.catalog = result.payload;
            this.currentSemester = currentSemester;
            this.lastUpdate = new Date(window.catalog.modified).toLocaleString();
        } else {
            this.currentSemester = null;
            this.lastUpdate = '';
        }
        this.pendingPromise = null;
        return result;
    }
}

export const semester = new Semesters();
export default semester;
