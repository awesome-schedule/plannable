/**
 * the semester module handles semester switching
 * @author Hanzhi Zhou
 */

/**
 *
 */
import { Component, Vue } from 'vue-property-decorator';
import { loadSemesterData } from '../data/CatalogLoader';
import { loadSemesterList } from '../data/SemesterListLoader';
import { SemesterJSON } from '../models/Catalog';
import { noti } from '.';

export interface SemesterState {
    [x: string]: any;
    semesters: SemesterJSON[];
    currentSemester: SemesterJSON | null;
    lastUpdate: string;
}

@Component
class Semesters extends Vue implements SemesterState {
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

        if (result.level !== 'info') noti.notify(result);
        console[result.level](result.msg);

        if (semesters) {
            this.semesters = semesters;
            return true;
        } else {
            this.semesters = [];
            return false;
        }
    }

    /**
     * DO NOT call this method. call Store.selectSemester instead.
     */
    async selectSemester(currentSemester: SemesterJSON, force: boolean = false) {
        // do a linear search to find the index of the semester given its string id

        if (force) noti.info(`Updating ${currentSemester.name} data...`);
        const result = await loadSemesterData(currentSemester, force);
        if (result.level !== 'info') noti.notify(result);
        console[result.level](result.msg);

        //  if the a catalog object is returned
        if (result.payload) {
            window.catalog = result.payload;
            this.currentSemester = currentSemester;
            this.lastUpdate = new Date(window.catalog.modified).toLocaleString();
            return true;
        } else {
            this.currentSemester = null;
            this.lastUpdate = '';
            return false;
        }
    }
}

export const semester = new Semesters();
export default semester;
