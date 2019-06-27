/**
 * @module components/tabs
 */
import Store from '@/store';
import { Component } from 'vue-property-decorator';
import GridSchedule from '../GridSchedule.vue';
import Schedule from '@/models/Schedule';
import randomColor from 'randomcolor';
import ScheduleBlock from '@/models/ScheduleBlock';

@Component({
    components: {
        GridSchedule
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
}
