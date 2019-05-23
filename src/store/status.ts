/**
 *
 */
import { Component, Vue } from 'vue-property-decorator';
import { schedule } from '.';
import Event from '../models/Event';

@Component
class Status extends Vue {
    /**
     * sidebar display status
     * show the specific sidebar when true, and hide when all false
     */
    sideBar: { [x: string]: boolean } = {
        showSelectClass: window.screen.width / window.screen.height > 1 ? true : false,
        showEvent: false,
        showFilter: false,
        showSetting: false,
        showExport: false,
        showSelectColor: false,
        showInfo: false,
        showExternal: false
    };

    // other
    loading = false;

    eventToEdit: Event | null = null;

    get sideBarActive() {
        for (const key in this.sideBar) {
            if (this.sideBar[key]) return true;
        }
        return false;
    }

    switchSideBar(key: string) {
        for (const other in this.sideBar) {
            if (other !== key) this.sideBar[other] = false;
        }
        this.sideBar[key] = !this.sideBar[key];

        if (this.sideBar.showSelectColor) schedule.switchSchedule(true);
    }
}

export const status = new Status();
export default status;
