/**
 * @module store
 */

/**
 *
 */
import { loadSemesterData } from '../data/CatalogLoader';
import { loadSemesterList } from '../data/SemesterListLoader';
import { SemesterJSON } from '../models/Catalog';

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
    [x: string]: any;
    semesters: SemesterJSON[] = [];
    currentSemester: SemesterJSON | null = null;
    lastUpdate: string = '';

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
        const result = await loadSemesterData(currentSemester, force);

        //  if the a catalog object is returned
        if (result.payload) {
            window.catalog = result.payload;
            this.currentSemester = currentSemester;
            this.lastUpdate = new Date(window.catalog.modified).toLocaleString();
        } else {
            this.currentSemester = null;
            this.lastUpdate = '';
        }
        return result;
    }
}

export const semester = new Semesters();
export default semester;
