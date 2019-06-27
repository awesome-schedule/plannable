/**
 * @module components/tabs
 */
import Store from '@/store';
import { Component } from 'vue-property-decorator';
import GridSchedule from '../GridSchedule.vue';
import Schedule from '@/models/Schedule';
import randomColor from 'randomcolor';
import ScheduleBlock from '@/models/ScheduleBlock';
import { constructAdjList } from '@/algorithm/Coloring';

/**
 * component for import/export/print schedules
 * @author Kaiying Shan, Hanzhi Zhou
 */
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
        for (const sche of this.compare) {
            const color = randomColor({
                luminosity: 'dark'
            }) as string;
            this.colors.push(color);
            for (let i = 0; i < 5; i++) {
                for (const sb of sche.days[i]) {
                    const nsb = new ScheduleBlock(color, sb.start, sb.end, sb.section);
                    this.compareSchedule.days[i].push(nsb);
                }
            }
        }
        console.log(this.compare);
        constructAdjList(this.compareSchedule);
    }
}
