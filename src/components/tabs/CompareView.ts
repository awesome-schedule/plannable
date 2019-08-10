/**
 * @module components/tabs
 */
import Course from '@/models/Course';
import Schedule from '@/models/Schedule';
import ScheduleBlock from '@/models/ScheduleBlock';
import Store from '@/store';
import randomColor from 'randomcolor';
import { Component } from 'vue-property-decorator';
import GridSchedule from '../GridSchedule.vue';
import MainContent from '../MainContent.vue';

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
    created() {
        this.renderSchedule();
    }
    renderSchedule() {
        this.compareSchedule = new Schedule();
        for (let i = 0; i < this.compare.length; i++) {
            const { schedule, color } = this.compare[i];
            for (let j = 0; j < 7; j++) {
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
    /**
     * get the description of the schedule at index `idx` of the `compare` array
     * @param idx
     */
    getTitle(idx: number) {
        const { schedule, pIdx, index } = this.compare[idx];
        const catalog = window.catalog;
        const secs = Object.entries(schedule.All).map(x => catalog.getCourse(...x));
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
        const evaluator = window.scheduleEvaluator;
        if (this.compare[idx].schedule.allEquals(evaluator.refSchedule)) {
            evaluator.refSchedule = {};
        } else {
            evaluator.refSchedule = this.compare[idx].schedule.All;

            delete evaluator.sortCoeffCache.similarity;
            if (!evaluator.empty()) {
                evaluator.sort();
                if (!this.schedule.generated) {
                    this.schedule.switchSchedule(true);
                } else {
                    // re-assign the current schedule
                    this.schedule.currentSchedule = evaluator.getSchedule(
                        this.schedule.currentScheduleIndex
                    );
                }
            }
        }
        this.$forceUpdate();
    }
    isSimilarSchedule(idx: number) {
        return this.compare[idx].schedule.allEquals(window.scheduleEvaluator.refSchedule);
    }
}
