/**
 * the "view" of this project; the root Vue component that contains almost all of the child components and DOM
 * elements of the main webpage.
 * @author Hanzhi Zhou, Kaiying Shan, Elena Long, Zichao Hu
 */

/**
 *
 */
import lz from 'lz-string';
import { Component } from 'vue-property-decorator';

import MainContent from './components/MainContent.vue';

// tab components
import ClassView from './components/tabs/ClassView.vue';
import DisplayView from './components/tabs/DisplayView.vue';
import EventView from './components/tabs/EventView.vue';
import ExportView from './components/tabs/ExportView.vue';
import External from './components/tabs/External.vue';
import FilterView from './components/tabs/FilterView.vue';
import PaletteView from './components/tabs/PaletteView.vue';
import CompareView from './components/tabs/CompareView.vue';

// other components
import GridSchedule from './components/GridSchedule.vue';
import Pagination from './components/Pagination.vue';
import CourseModal from './components/CourseModal.vue';
import SectionModal from './components/SectionModal.vue';
import URLModal from './components/URLModal.vue';

import { loadBuildingList, loadTimeMatrix } from './data/BuildingLoader';
import Store from './store';
import { NotiMsg } from './store/notification';
import randomColor from 'randomcolor';
import { timeout, errToStr } from './utils';
import { loadSemesterList } from './data/SemesterListLoader';

async function fallback<T, P extends Promise<T>>(
    temp: { new: P; old?: T },
    { succMsg = '', warnMsg = (x: string) => x, errMsg = (x: string) => x, time = 5000 } = {}
): Promise<NotiMsg<T>> {
    try {
        return {
            payload: await timeout(temp.new, time),
            msg: succMsg,
            level: 'success'
        };
    } catch (err) {
        if (temp.old) {
            return {
                payload: temp.old,
                msg: warnMsg(errToStr(err)),
                level: 'success'
            };
        } else {
            return {
                msg: errMsg(errToStr(err)),
                level: 'success'
            };
        }
    }
}

@Component({
    components: {
        MainContent,
        ClassView,
        EventView,
        DisplayView,
        FilterView,
        PaletteView,
        ExportView,
        CompareView,
        Pagination,
        GridSchedule,
        SectionModal,
        CourseModal,
        URLModal,
        External,
        // use dynamic component for this one because it is relatively large in size
        Information: () => import('./components/tabs/Information.vue'),
        // opt-in components
        FuzzyView: () => import('./components/tabs/FuzzyView.vue'),
        LogView: () => import('./components/tabs/LogView.vue')
    }
})
export default class App extends Store {
    get sideBar() {
        return this.status.sideBar;
    }

    async loadConfigFromURL() {
        const config = new URLSearchParams(window.location.search).get('config');

        if (config) {
            try {
                this.profile.addProfile(
                    lz.decompressFromEncodedURIComponent(config.trim()),
                    'url loaded'
                );
                await this.loadProfile();
                this.noti.success('Configuration loaded from URL!', 3, true);
                return true;
            } catch (err) {
                console.error(err);
                this.noti.error(err.message + ': Parsing error');
            }
        }
        return false;
    }

    async created() {
        this.status.loading = true;

        // note: these three can be executed in parallel, i.e. they are not inter-dependent
        const [pay1, pay2, pay3] = await Promise.all([
            fallback(loadTimeMatrix()),
            fallback(loadBuildingList()),
            fallback(loadSemesterList())
        ]);

        this.noti.notify(pay1);
        if (pay1.payload) window.timeMatrix = pay1.payload;

        this.noti.notify(pay2);
        if (pay2.payload) window.buildingList = pay2.payload;

        this.noti.notify(pay3);
        if (pay3.payload) {
            const urlResult = await this.loadConfigFromURL();
            if (!urlResult) {
                this.profile.initProfiles(this.semester.semesters);
                await this.loadProfile(this.profile.current);
            } else {
                history.replaceState(history.state, 'current', '/');
            }
        }

        this.status.loading = false;
    }
    /**
     * @returns return the index of current schedule in compares array.
     *          return -1 if current schedule is not in compares.
     */
    indexOfCompare() {
        return this.compare.findIndex(c => c.schedule.equals(this.schedule.currentSchedule));
    }

    addToCompare() {
        const idx = this.indexOfCompare();
        if (idx !== -1) {
            this.compare.splice(idx, 1);
        } else {
            const color = randomColor({
                luminosity: 'dark'
            }) as string;
            this.compare.push({
                schedule: this.schedule.currentSchedule,
                profileName: this.profile.current,
                index: this.schedule.currentScheduleIndex,
                color
            });
        }
    }
}
