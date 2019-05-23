/**
 * the status module stores the temporal statuses of the webpage. These statuses are not stored
 */

/**
 *
 */
import { Component, Vue, Watch } from 'vue-property-decorator';
import { schedule, noti } from '.';
import Event from '../models/Event';
import { timingSafeEqual } from 'crypto';

interface Sidebars {
    showSelectClass: boolean;
    showEvent: boolean;
    showFilter: boolean;
    showSetting: boolean;
    showExport: boolean;
    showSelectColor: boolean;
    showInfo: boolean;
    showExternal: boolean;
}

interface SidebarStatus extends Sidebars {
    [key: string]: boolean;
}

@Component
class Status extends Vue {
    get sideBarActive() {
        for (const key in this.sideBar) {
            if (this.sideBar[key]) return true;
        }
        return false;
    }
    /**
     * sidebar display status
     * show the specific sidebar when true, and hide when all false
     */
    sideBar: SidebarStatus = {
        showSelectClass: window.screen.width / window.screen.height > 1 ? true : false,
        showEvent: false,
        showFilter: false,
        showSetting: false,
        showExport: false,
        showSelectColor: false,
        showInfo: false,
        showExternal: false
    };

    /**
     * indicates whether some IO action is running in the background, such as semester data update
     *
     * no need to assign to this value when doing computationally expensive operations
     */
    loading = false;

    eventToEdit: Event | null = null;

    @Watch('loading')
    loadingWatch() {
        if (this.loading) {
            if (noti.empty()) {
                noti.info('Loading...');
            }
        } else {
            if (noti.msg === 'Loading...') {
                noti.clear();
            }
        }
    }

    switchSideBar(key: keyof Sidebars) {
        for (const other in this.sideBar) {
            if (other !== key) this.sideBar[other] = false;
        }
        this.sideBar[key] = !this.sideBar[key];
    }
}

export const status = new Status();
export default status;
