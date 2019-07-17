/**
 * @module components/tabs
 */
import Store from '@/store';
import { Component } from 'vue-property-decorator';
import GridSchedule from '../GridSchedule.vue';
import MainContent from '../MainContent.vue';
import Schedule from '@/models/Schedule';
import ScheduleBlock from '@/models/ScheduleBlock';
import randomColor from 'randomcolor';
import Course from '@/models/Course';

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
    compareSchedule = new Schedule();
    highlightIdx = -1;
    get number() {
        return this.compare.length;
    }
    created() {
        this.renderSchedule();
    }
    renderSchedule() {
        this.compareSchedule = new Schedule();
        for (let i = 0; i < this.compare.length; i++) {
            const comp = this.compare[i];
            const sche = comp.schedule;
            const color = comp.color;
            for (let j = 0; j < 5; j++) {
                for (const sb of sche.days[j]) {
                    const nsb = new ScheduleBlock(color, sb.start, sb.end, sb.section);
                    if (this.highlightIdx === i) {
                        nsb.strong = true;
                    } else {
                        nsb.strong = false;
                    }
                    this.compareSchedule.days[j].push(nsb);
                }
            }
        }
        this.compareSchedule.computeBlockPositions();
    }
    randColor(idx: number) {
        this.compare[idx].color = randomColor({
            luminosity: 'dark'
        }) as string;
        this.renderSchedule();
    }
    deleteCompare(idx: number) {
        this.compare.splice(idx, 1);
        this.renderSchedule();
    }
    getTitle(idx: number) {
        const schedule = this.compare[idx].schedule;
        const all = schedule.All;
        const catalog = window.catalog;
        const secs: Course[] = [];
        for (const crs in all) {
            const num = all[crs];
            secs.push(catalog.getCourse(crs, num));
        }
        return (
            'Total credits: ' +
            schedule.totalCredit +
            '\n' +
            secs
                .map(x =>
                    x.sections
                        .map(y => y.department + ' ' + y.number + '-' + y.section + ' ' + y.title)
                        .reduce((a, z) => a + ', ' + z)
                )
                .reduce((a, x) => a + '\n' + x)
        );
    }
    highlight(idx: number) {
        if (idx === this.highlightIdx) {
            this.highlightIdx = -1;
        } else {
            this.highlightIdx = idx;
        }
        this.renderSchedule();
    }
}
