/**
 * the status module stores the temporary statuses of the webpage. We do not save these statuses to localStorage
 * @author Hanzhi Zhou
 */

/**
 *
 */
import Event from '../models/Event';

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

class Status {
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

    get sideBarActive() {
        for (const key in this.sideBar) {
            if (this.sideBar[key]) return true;
        }
        return false;
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
