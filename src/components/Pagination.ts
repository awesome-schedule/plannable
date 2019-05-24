/**
 * The component for showing a list of pages, used for switching between generated schedules
 *
 * @author Kaiying Shan, Hanzhi Zhou
 */

/**
 *
 */
import { Component, Mixins, Watch } from 'vue-property-decorator';
import Store from '../store';

@Component
export default class Pagination extends Mixins(Store) {
    get curIdx() {
        return this.schedule.currentScheduleIndex;
    }

    get generated() {
        return this.schedule.generated;
    }

    get scheduleLength() {
        return this.schedule.numGenerated;
    }

    get length() {
        if (window.screen.width < 900) {
            return this.scheduleLength < 3 ? this.scheduleLength : 3;
        } else {
            return this.scheduleLength < 10 ? this.scheduleLength : 10;
        }
    }

    /**
     * zero based schedule index
     */
    idx = 0;
    /**
     * zero based offset
     */
    start = 0;
    goto = null;

    updateStart() {
        if (this.idx < this.start) {
            this.start = this.idx;
        } else if (this.idx >= this.start + this.length) {
            this.start = this.idx - this.length + 1;
        }
    }
    switchPage(idx: number) {
        idx = isNaN(idx) ? 0 : +idx;
        if (idx >= this.scheduleLength) {
            this.idx = this.scheduleLength - 1;
        } else if (idx < 0) {
            this.idx = 0;
        } else {
            this.idx = idx;
        }
        this.schedule.switchPage(this.idx);
    }

    @Watch('curIdx')
    autoSwitch() {
        this.switchPage(this.curIdx);
        this.updateStart();
    }
}
