/**
 * @module components
 */

/**
 * @author Cat
 */
import Schedule from '@/models/Schedule';
import { Component, Prop, Vue } from 'vue-property-decorator';

@Component
export default class DateSeparator extends Vue {
    @Prop(Schedule) curSchedule!: Schedule;
    public selectInterval(idx: number) {
        this.curSchedule.dateSelector = idx;
        this.curSchedule.computeSchedule();
    }

    public convDate(n: number, offset: number = 0) {
        const date = new Date(n + offset * 24 * 60 * 60 * 1000);
        return date.getMonth() + 1 + '/' + date.getDate();
    }
}
