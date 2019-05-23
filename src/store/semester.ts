/**
 *
 */
import { Component, Vue } from 'vue-property-decorator';
import { loadSemesterData } from '../data/CatalogLoader';
import { loadSemesterList } from '../data/SemesterListLoader';
import { SemesterJSON } from '../models/Catalog';
import { parseStatus, noti, status } from '.';

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

    setSemesters(semesters: SemesterJSON[]) {
        this.semesters = semesters;
    }

    async loadSemesters() {
        const result = await loadSemesterList();
        const semesters = result.payload;

        if (result.level !== 'info') noti.notify(result);
        console[result.level](result.msg);

        if (semesters) {
            this.semesters = window.semesters = semesters;
            return true;
        } else {
            this.semesters = [];
            return false;
        }
    }

    /**
     * Select a semester and fetch all its associated data.
     *
     * This method will assign a correct Catalog object to `window.catalog`
     *
     * Then, schedules and settings will be parsed from `localStorage`
     * and assigned to relevant fields of `this`.
     *
     * If no local data is present, default values will be assigned.
     *
     * @param semesterId index or id of this semester
     * @param force whether to force-update semester data
     */
    async selectSemester(semesterId: string | number, force: boolean = false) {
        // do a linear search to find the index of the semester given its string id
        if (typeof semesterId === 'string') {
            for (let i = 0; i < this.semesters.length; i++) {
                if (this.semesters[i].id === semesterId) {
                    semesterId = i;
                    break;
                }
            }
            // not found: return
            if (typeof semesterId === 'string') {
                this.currentSemester = null;
                this.lastUpdate = '';
                return;
            }
        }

        status.loading = true;
        const currentSemester = this.semesters[semesterId];
        if (force) noti.info(`Updating ${currentSemester.name} data...`);
        const result = await loadSemesterData(semesterId, force);
        if (result.level !== 'info') noti.notify(result);
        console[result.level](result.msg);

        //  if the a catalog object is returned
        if (result.payload) {
            window.catalog = result.payload;
            this.currentSemester = currentSemester;
            this.lastUpdate = new Date(window.catalog.modified).toLocaleString();

            parseStatus(currentSemester.id);
        } else {
            this.currentSemester = null;
            this.lastUpdate = '';
        }
        status.loading = false;
    }
}

export const semester = new Semesters();
export default semester;
