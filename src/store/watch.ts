/**
 * @module store
 */

/**
 *
 */
import Schedule from '@/models/Schedule';
import { Component, Watch } from 'vue-property-decorator';
import Store from './store';
import colorSchemes from '@/data/ColorSchemes';
/**
 * the watch factory defines some watchers on the members in `Store`.
 * these watchers are defined outside of the `Store` class because they should only be registered once.
 * @author Hanzhi Zhou
 */
@Component
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
        Schedule.multiSelect = this.display.multiSelect;
        this.schedule.recomputeAll(false, 100);
    }

    @Watch('display.combineSections')
    private a() {
        Schedule.combineSections = this.display.combineSections;
        this.schedule.recomputeAll(false, 100);
    }

    @Watch('display.colorScheme')
    private e() {
        Schedule.colors = colorSchemes[this.display.colorScheme].colors;
        this.schedule.recomputeAll(false, 100);
    }

    @Watch('palette.savedColors', { deep: true })
    private b() {
        Schedule.savedColors = this.palette.savedColors;
        this.schedule.recomputeAll(false, 100);
    }

    @Watch('profile.current')
    private c() {
        localStorage.setItem('currentProfile', this.profile.current);
    }

    @Watch('profile.profiles', { deep: true })
    private d() {
        localStorage.setItem('profiles', JSON.stringify(this.profile.profiles));
    }

    // cannot watch schedules because it is too costly
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
