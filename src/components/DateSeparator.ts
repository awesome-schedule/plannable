/**
 * @module components
 */

/**
 * @author Cat
 */
import { Vue, Component, Prop } from 'vue-property-decorator';
import Schedule from '@/models/Schedule';

@Component
export default class DateSeparator extends Vue {
    @Prop(Schedule) curSchedule!: Schedule;
    public selectInterval(idx: number) {
        this.curSchedule.dateSelector = idx;
        this.curSchedule.computeSchedule();
    }
}
