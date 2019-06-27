/**
 * @module components/tabs
 */
import Store, { SemesterStorage } from '@/store';
import { savePlain, toICal } from '@/utils';
import lz from 'lz-string';
import { Component } from 'vue-property-decorator';
import GridSchedule from '../GridSchedule.vue';
import Schedule from '@/models/Schedule';
import randomColor from 'randomcolor';
import ScheduleBlock from '@/models/ScheduleBlock';
import { constructAdjList } from '../../algorithm/Coloring';
import param from '../../config';

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

    get scheduleWidth() {
        return this.status.sideBarActive
            ? 100 - param.sideBarWidth - param.tabBarWidth - param.sideMargin
            : 100 - param.tabBarWidth - param.sideMargin;
    }
    get scheduleLeft() {
        return this.status.sideBarActive
            ? param.sideBarWidth + param.tabBarWidth + 1
            : param.tabBarWidth;
    }

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
