/**
 * @module store
 */

/**
 *
 */
import Schedule from '@/models/Schedule';
import { Component, Watch } from 'vue-property-decorator';
import Store from './store';
/**
 * the watch factory defines some watchers on the members in `Store`.
 * these watchers are defined outside of the `Store` class because they should only be registered once.
 * @author Hanzhi Zhou
 */
@Component
// tslint:disable-next-line: max-classes-per-file
export default class WatchFactory extends Store {
    @Watch('status.loading')
    loadingWatch() {
        if (this.status.loading) {
            if (this.noti.empty()) {
                this.noti.info('Loading...');
            }
        } else {
            if (this.noti.msg === 'Loading...') {
                this.noti.clear();
            }
        }
    }

    @Watch('display.multiSelect')
    private w0() {
        Schedule.options.multiSelect = this.display.multiSelect;
        this.schedule.currentSchedule.computeSchedule();
    }

    @Watch('display.combineSections')
    private a() {
        Schedule.options.combineSections = this.display.combineSections;
        this.schedule.currentSchedule.computeSchedule();
    }

    @Watch('palette.savedColors', { deep: true })
    private b() {
        Schedule.savedColors = this.palette.savedColors;
        this.schedule.currentSchedule.computeSchedule();
    }

    @Watch('profile.current')
    private c() {
        localStorage.setItem('currentProfile', this.profile.current);
    }

    @Watch('profile.profiles', { deep: true })
    private d() {
        localStorage.setItem('profiles', JSON.stringify(this.profile.profiles));
    }

    // @Watch('schedule', { deep: true })
    // private w1() {
    //     this.saveStatus();
    // }

    @Watch('display', { deep: true })
    private w2() {
        this.saveStatus();
    }

    @Watch('filter', { deep: true })
    private w3() {
        this.saveStatus();
    }

    @Watch('palette', { deep: true })
    private w4() {
        this.saveStatus();
    }
}
