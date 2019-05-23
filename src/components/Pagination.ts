/**
 * The component for showing a list of pages, used for switching between generated schedules
 *
 * @author Kaiying Shan, Hanzhi Zhou
 */

/**
 *
 */
import { Vue, Component } from 'vue-property-decorator';
import schedule from '../store/schedule';
import { createDecorator } from 'vue-class-component';
import { ComputedOptions } from 'vue';

export const NoCache = createDecorator((options, key) => {
    // component options should be passed to the callback
    // and update for the options object affect the component
    (options.computed![key] as ComputedOptions<any>).cache = false;
});

@Component
export default class Pagination extends Vue {
    get curIdx() {
        return schedule.currentScheduleIndex;
    }

    @NoCache
    get scheduleLength() {
        return window.scheduleEvaluator.size();
    }

    get length() {
        if (window.screen.width < 900) {
            return this.scheduleLength < 3 ? this.scheduleLength : 3;
        } else {
            return this.scheduleLength < 10 ? this.scheduleLength : 10;
        }
    }

    idx = 0;
    start = 0;
    goto = null;

    created() {
        this.autoSwitch();
    }
    updated() {
        this.autoSwitch();
    }
    updateStart() {
        if (this.idx < this.start) {
            this.start = this.idx;
        } else if (this.idx >= this.start + this.length) {
            this.start = this.idx - this.length + 1;
        }
    }
    switchPage(idx: number) {
        idx = +idx;
        if (idx >= 0 && idx < this.scheduleLength && !isNaN(idx)) {
            this.idx = idx;
            schedule.switchPage(this.idx);
        } else if (idx >= this.scheduleLength) {
            this.idx = this.scheduleLength - 1;
            schedule.switchPage(this.idx);
        } else if (idx < 0) {
            this.idx = 0;
            schedule.switchPage(this.idx);
        }
    }
    autoSwitch() {
        if (this.curIdx && this.curIdx >= 0 && this.curIdx < this.scheduleLength) {
            this.idx = this.curIdx;
            this.switchPage(this.idx);
            this.updateStart();
            schedule.switchPage(this.idx);
        }
    }
}
