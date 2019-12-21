/**
 * @module components
 */

/**
 * @author Kaiying Cat
 * @noInheritDoc
 */
import Schedule from '@/models/Schedule';
import { Component, Prop, Vue } from 'vue-property-decorator';

@Component
export default class DateSeparator extends Vue {
    @Prop(Object) curSchedule!: Schedule;
    public selectInterval(idx: number) {
        this.curSchedule.dateSelector = idx;
        this.curSchedule.computeSchedule();
    }

    public convDate(n: number, offset = 0) {
        const date = new Date(n + offset * 24 * 60 * 60 * 1000);
        return (
            (date.getMonth() + 1).toString().padStart(2, '0') +
            '/' +
            date
                .getDate()
                .toString()
                .padStart(2, '0')
        );
    }
}
