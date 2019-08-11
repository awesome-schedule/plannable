/**
 * @module components/tabs
 */

/**
 *
 */
import Schedule, { ScheduleAll } from '@/models/Schedule';
import ScheduleBlock from '@/models/ScheduleBlock';
import Store from '@/store';
import randomColor from 'randomcolor';
import { Component } from 'vue-property-decorator';
import GridSchedule from '../GridSchedule.vue';
import MainContent from '../MainContent.vue';

/**
 * component for comparing multiple schedules
 * @author Kaiying Shan, Hanzhi Zhou
 * @noInheritDoc
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

    get refSchedule() {
        return this.getDesc(this.filter.refSchedule);
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
        return (
            `Generated schedule ${index + 1},\nCorresponds to proposed schedule ${pIdx + 1}\n` +
            `Total credits: ${schedule.totalCredit}\n${this.getDesc(schedule.All)}`
        );
    }
    /**
     * get description for a schedule
     * @param All the `All variable` of a schedule
     * @see [[Schedule.All]]
     */
    getDesc(All: ScheduleAll) {
        const catalog = window.catalog;
        return Object.entries(All)
            .map(x => {
                const course = catalog.getCourse(...x);
                return `${course.department} ${course.number}-${course.sections
                    .map(y => y.section)
                    .reduce((a, z) => a + '/' + z)} ${course.title}`;
            })
            .reduce((a, x) => a + '\n' + x);
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
        // remove similarity cache
        delete evaluator.sortCoeffCache.similarity;
        const opt = evaluator.options.sortBy.find(x => x.name === 'similarity')!;

        // we click the reference schedule again: clear the reference schedule
        if (this.compare[idx].schedule.allEquals(evaluator.refSchedule)) {
            this.filter.refSchedule = evaluator.refSchedule = {};
            opt.enabled = false;
        } else {
            this.filter.refSchedule = evaluator.refSchedule = this.compare[idx].schedule.All;
            opt.enabled = true;
        }
        if (!evaluator.empty() && this.validateSortOptions()) {
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
        this.$forceUpdate();
    }
    isSimilarSchedule(idx: number) {
        return this.compare[idx].schedule.allEquals(window.scheduleEvaluator.refSchedule);
    }
}
