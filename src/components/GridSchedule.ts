/**
 * @module src/components
 */

/**
 *
 */
import Schedule, { DAYS } from '@/models/Schedule';
import { Component, Prop } from 'vue-property-decorator';
import Store from '../store';
import { hr24toInt, roundTime, to12hr } from '../utils';
import CourseBlock from './CourseBlock.vue';

/**
 * the component for rendering a schedule (with courses and events) on a grid
 * @author Kaiying Cat
 * @noInheritDoc
 */
@Component({
    components: {
        CourseBlock
    }
})
export default class GridSchedule extends Store {
    @Prop(Object) readonly currentSchedule!: Schedule;

    df = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    get days() {
        return this.display.showWeekend ? DAYS : DAYS.slice(0, 5);
    }

    get daysFull() {
        return this.display.showWeekend ? this.df : this.df.slice(0, 5);
    }

    /**
     * return the block in which the earliest class starts, the 8:00 block is zero
     * return 0 if no class
     */
    get earliestBlock() {
        let earliest = 48;
        const schedule = this.currentSchedule;
        for (const blocks of schedule.days) {
            for (const course of blocks) {
                const temp = roundTime(course.startMin);
                if (temp < earliest) {
                    earliest = temp;
                }
            }
        }
        return earliest;
    }
    /**
     * return the block in which the latest class ends, the 8:00 block is zero
     */
    get latestBlock() {
        let latest = 0;
        const schedule = this.currentSchedule;
        for (const blocks of schedule.days) {
            for (const course of blocks) {
                const temp = roundTime(course.endMin);
                if (temp > latest) {
                    latest = temp;
                }
            }
        }
        return latest;
    }
    /**
     * return the block in which the schedule starts with
     */
    get absoluteEarliest() {
        return Math.min(this.earliestBlock, roundTime(hr24toInt(this.display.earliest)));
    }
    /**
     * return the block in which the schedule ends with
     */
    get absoluteLatest() {
        return Math.max(this.latestBlock, roundTime(hr24toInt(this.display.latest)));
    }

    /**
     * computes the number of rows we need
     */
    get numRow() {
        return this.absoluteLatest + 1 - this.absoluteEarliest;
    }

    get numCol() {
        return this.display.showWeekend ? 7 : 5;
    }

    get gridTemplateCols() {
        return `${100 / this.numCol}% `.repeat(this.numCol);
    }

    get hours() {
        const time = [];
        const stdTime = [];
        const reducedTime = [];
        for (let i = this.absoluteEarliest; i <= this.absoluteLatest; i++) {
            const curTime = `${Math.floor(i / 2)}:${i % 2 ? '30' : '00'}`;
            time.push(curTime);
            stdTime.push(to12hr(curTime));
            reducedTime.push(i % 2 !== 0 ? '' : (i / 2).toString());
        }

        return window.screen.width > 450 ? (this.display.standard ? stdTime : time) : reducedTime;
    }
    get heightInfo() {
        const heights: number[] = new Array(this.numRow).fill(this.display.partialHeight);
        const earliest = this.absoluteEarliest;
        for (const blocks of this.currentSchedule.days) {
            for (const course of blocks) {
                const startTime = roundTime(course.startMin);
                const endTime = roundTime(course.endMin);
                for (let i = startTime; i <= endTime; i++) {
                    heights[i - earliest] = this.display.fullHeight;
                }
            }
        }
        const cumulativeHeights = heights.concat();
        // to prefix array
        for (let i = 1; i < cumulativeHeights.length; i++) {
            cumulativeHeights[i] += cumulativeHeights[i - 1];
        }
        return {
            heights,
            cumulativeHeights
        };
    }
}
