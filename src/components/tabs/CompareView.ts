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
    colors: string[] = [];

    get number() {
        return this.compare.length;
    }

    created() {
        this.createdHelper();
    }

    createdHelper() {
        for (let i = 0; i < this.compare.length; i++) {
            const sche = this.compare[i].schedule;
            let color = randomColor({
                luminosity: 'dark'
            }) as string;
            if (this.colors.length <= i) {
                this.colors.push(color);
            } else {
                color = this.colors[i];
            }
            for (let i = 0; i < 5; i++) {
                for (const sb of sche.days[i]) {
                    const nsb = new ScheduleBlock(color, sb.start, sb.end, sb.section);
                    this.compareSchedule.days[i].push(nsb);
                }
            }
        }
        this.compareSchedule.computeBlockPositions();
    }

    deleteCompare(idx: number) {
        this.compare.splice(idx, 1);
        this.colors.splice(idx, 1);
        this.compareSchedule = new Schedule();
        this.createdHelper();
    }
}
