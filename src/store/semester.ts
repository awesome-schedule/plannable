/**
 * the semester module handles semester switching
 * @author Hanzhi Zhou
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

        console[result.level](result.msg);

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
        console[result.level](result.msg);

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
