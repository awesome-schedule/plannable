/**
 * @module components/tabs
 */
import Store from '@/store';
import { Component } from 'vue-property-decorator';
import GridSchedule from '../GridSchedule.vue';
import MainContent from '../MainContent.vue';
import Schedule from '@/models/Schedule';
import ScheduleBlock from '@/models/ScheduleBlock';

/**
 * component for comparing multiple schedules
 * @author Kaiying Shan, Hanzhi Zhou
 */
@Component({
    components: {
        GridSchedule,
        MainContent
    }
})
export default class CompareView extends Store {
    compareSchedule: Schedule = new Schedule();

    get number() {
        return this.compare.length;
    }

    created() {
        this.createdHelper();
    }

    createdHelper() {
        for (const comp of this.compare) {
            const sche = comp.schedule;
            const color = comp.color;
            for (let i = 0; i < 5; i++) {
                for (const sb of sche.days[i]) {
                    const nsb = new ScheduleBlock(color, sb.start, sb.end, sb.section);
                    this.compareSchedule.days[i].push(nsb);
                }
            }
        }
        this.compareSchedule.computeBlockPositions();
    }

    changeColor() {
        this.compareSchedule = new Schedule();
        this.createdHelper();
    }

    deleteCompare(idx: number) {
        this.compare.splice(idx, 1);
        this.compareSchedule = new Schedule();
        this.createdHelper();
    }
    getTitle(idx: number) {
        const schedule = this.compare[idx].schedule;
        return (
            'Total credits: ' +
            schedule.totalCredit +
            '\n' +
            schedule.currentCourses
                .map(x => x.department + ' ' + x.number + ' ' + x.title)
                .reduce((a, x) => a + '\n' + x)
        );
    }
}
