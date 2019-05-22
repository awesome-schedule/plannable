/**
 *
 */
import { SemesterJSON } from '@/models/Catalog';
import { loadSemesterList } from '@/data/SemesterListLoader';
import noti from './notification';
import { loadSemesterData } from '@/data/CatalogLoader';
import { Vue, Component, Prop } from 'vue-property-decorator';

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
                return false;
            }
        }

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
