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
            const { schedule, color } = comp;
            for (let j = 0; j < 5; j++) {
                for (const sb of schedule.days[j]) {
                    const nsb = new ScheduleBlock(color, sb.start, sb.end, sb.section);
                    nsb.strong = this.highlightIdx === i;
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
        const { schedule, pIdx, index } = this.compare[idx];
        const all = schedule.All;
        const catalog = window.catalog;
        const secs: Course[] = [];
        for (const crs in all) {
            const num = all[crs];
            secs.push(catalog.getCourse(crs, num));
        }
        return (
            `Generated schedule ${index + 1},\nCorresponds to proposed schedule ${pIdx + 1}\n` +
            `Total credits: ${schedule.totalCredit}\n${secs
                .map(
                    x =>
                        `${x.department} ${x.number}-${x.sections
                            .map(y => y.section)
                            .reduce((a, z) => a + '/' + z)} ${x.title}`
                )
                .reduce((a, x) => a + '\n' + x)}`
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
    similarity(idx: number) {
        const all = this.compare[idx].schedule.All;
        const sim: [string, ...number[]][] = [];
        for (const key in all) {
            sim.push([key, ...(all[key] as Set<number>).keys()] as [string, ...number[]]);
        }
        window.similaritySchedule = sim;
        window.scheduleEvaluator.updateSimilarity();
        if (!window.scheduleEvaluator.empty()) {
            window.scheduleEvaluator.sort({ newOptions: this.filter.sortOptions });
            if (!this.schedule.generated) {
                this.schedule.switchSchedule(true);
            } else {
                // re-assign the current schedule
                this.schedule.currentSchedule = window.scheduleEvaluator.getSchedule(
                    this.schedule.currentScheduleIndex
                );
            }
        }

    }
    isSimilarSchedule(idx: number) {
        const all = this.compare[idx].schedule.All;
        const a: [string, ...number[]][] = [];
        for (const key in all) {
            a.push([key, ...(all[key] as Set<number>).keys()] as [string, ...number[]]);
        }
        const b = window.similaritySchedule;
        if (a.length !== b.length) return false;
        outer: for (const i of a) {
            for (const j of b) {
                if (i[0] === j[0]) {
                    if (i[1] === j[1]) continue outer;
                }
            }
            return false;
        }
        return true;
    }
}
