/**
 * @module src/components/tabs
 */

/**
 *
 */
import { computeBlockPositions } from '@/algorithm/Renderer';
import { MeetingDate } from '@/algorithm/ScheduleGenerator';
import GeneratedSchedule from '@/models/GeneratedSchedule';
import { ScheduleDays } from '@/models/Schedule';
import ScheduleBlock from '@/models/ScheduleBlock';
import Store from '@/store';
import randomColor from 'randomcolor';
import { Component } from 'vue-property-decorator';
import DateSeparator from '../DateSeparator.vue';
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
        MainContent,
        DateSeparator
    }
})
export default class CompareView extends Store {
    compareSchedule = new GeneratedSchedule();
    highlightIdx = -1;
    similarityRefShown = false;

    created() {
        this.renderSchedule(true);
    }

    get refSchedule() {
        return this.getDesc(this.filter.refSchedule);
    }

    async renderSchedule(reconstructDateSeparator: boolean) {
        if (reconstructDateSeparator) {
            const dates: MeetingDate[] = [];
            for (const { schedule } of this.compare) {
                for (const day of schedule.days) {
                    for (const { dateArray } of day) {
                        if (dateArray)
                            dates.push(dateArray);
                    }
                }
            }
            this.compareSchedule.constructDateSeparatorFromDateList(dates);
        }
        const days: ScheduleDays = [[], [], [], [], [], [], []];
        for (let i = 0; i < this.compare.length; i++) {
            const { schedule, color } = this.compare[i];
            const highlighted = this.highlightIdx === i;
            for (let j = 0; j < 7; j++) {
                for (const sb of schedule.days[j]) {
                    if (this.compareSchedule.checkDate(sb.dateArray)) {
                        const nsb = new ScheduleBlock(
                            color,
                            sb.startMin,
                            sb.endMin,
                            sb.section,
                            sb.meeting,
                            sb.dateArray
                        );
                        nsb.strong = highlighted;
                        days[j].push(nsb);
                    }
                }
            }
        }
        await computeBlockPositions(days);
        this.compareSchedule.days = days;
    }
    randColor(idx: number) {
        this.compare[idx].color = randomColor({ luminosity: 'dark' });
        this.renderSchedule(false);
    }
    deleteCompare(idx: number) {
        this.compare.splice(idx, 1);
        this.renderSchedule(true);
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
     * @param All the `All variable` of a generated schedule
     * @see [[Schedule.All]]
     */
    getDesc(All: GeneratedSchedule['All']) {
        const catalog = window.catalog;
        return Object.entries(All)
            .map(x => {
                const course = catalog.getCourse(
                    x[0],
                    x[1].reduce((acc, x) => {
                        for (const v of x) acc.add(v);
                        return acc;
                    }, new Set<number>())
                );
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
        this.renderSchedule(false);
    }
    similarity(idx: number) {
        const evaluator = window.scheduleEvaluator;
        // remove similarity cache
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
    renderSimilarityRefSchedule() {
        this.compareSchedule = new GeneratedSchedule();
        if (!this.similarityRefShown) {
            this.compareSchedule.All = this.filter.refSchedule;
            this.compareSchedule.computeSchedule();
        }
        this.similarityRefShown = !this.similarityRefShown;
    }
}
