/**
 * @module components
 */
import { Component, Prop } from 'vue-property-decorator';
import { DAYS } from '../models/Meta';
import Store from '../store';
import { timeToNum, to12hr } from '../utils';
import CourseBlock from './CourseBlock.vue';
import Schedule from '@/models/Schedule';

/**
 * the component for rendering a schedule (with courses and events) on a grid
 * @author Kaiying Cat
 */
@Component({
    components: {
        CourseBlock
    }
})
export default class GridSchedule extends Store {
    @Prop(Schedule) readonly currentSchedule!: Schedule;

    df = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    // note: we need Schedule.days because it's an array that keeps the keys in order
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
        let earliest = 817;
        const schedule = this.currentSchedule;
        for (const blocks of schedule.days) {
            for (const course of blocks) {
                const temp = timeToNum(course.start);
                if (temp < earliest && course !== undefined && course !== null) {
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
                const temp = timeToNum(course.end);
                if (temp > latest && course !== undefined && course !== null) {
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
        const early = this.validate(this.display.earliest, '8:00');

        if (timeToNum(early) > this.earliestBlock) {
            return this.earliestBlock;
        } else {
            return timeToNum(early);
        }
    }
    /**
     * return the block in which the schedule ends with
     */
    get absoluteLatest() {
        const late = this.validate(this.display.latest, '19:00');
        if (timeToNum(late) < this.latestBlock) {
            return this.latestBlock;
        } else {
            return timeToNum(late);
        }
    }

    get gridTemplateCols() {
        const numCol = this.numCol;
        return `${100 / numCol}% ${100 / numCol}% ${100 /
            numCol}% ${100 / numCol}% ${100 / numCol}% ${
            numCol === 7 ? 100 / numCol + '%' : ''
            } ${numCol === 7 ? 100 / numCol + '%' : ''}`;
    }

    /**
     * computes the number of rows we need
     */
    get numRow() {
        let num = 0;
        for (let i = this.absoluteEarliest; i <= this.absoluteLatest; i++) {
            num += 1;
        }
        return num;
    }

    get numCol() {
        return this.display.showWeekend ? 7 : 5;
    }

    get hours() {
        let curTime = '';
        if (this.absoluteEarliest % 2 === 0) {
            curTime = this.absoluteEarliest / 2 + 8 + ':00';
        } else {
            curTime = (this.absoluteEarliest - 1) / 2 + 8 + ':30';
        }

        const time = [];
        const stdTime = [];
        const reducedTime = [];
        for (let i = this.absoluteEarliest; i <= this.absoluteLatest; i++) {
            time.push(curTime);
            stdTime.push(to12hr(curTime));
            curTime = this.increTime(curTime);
            // note: need .toString to make the type of reducedTime consistent
            reducedTime.push(i % 2 !== 0 ? '' : (i / 2 + 8).toString());
        }

        return window.screen.width > 450 ? (this.display.standard ? stdTime : time) : reducedTime;
    }
    get items() {
        const arr: number[] = [];
        const numBlocks = (this.absoluteLatest - this.absoluteEarliest + 1) * this.numCol;
        for (let i = 0; i < numBlocks; i++) {
            arr.push(i + 1);
        }
        return arr;
    }
    get heightInfo() {
        const info: number[] = new Array(this.numRow);
        info.fill(this.display.partialHeight);
        const earliest = this.absoluteEarliest;
        const schedule = this.currentSchedule;
        for (const blocks of schedule.days) {
            for (const course of blocks) {
                const startTime = timeToNum(course.start);
                const endTime = timeToNum(course.end);
                for (let i = startTime; i <= endTime; i++) {
                    info[i - earliest] = this.display.fullHeight;
                }
            }
        }
        return info;
    }
    get mainHeight() {
        let h = 0;
        for (const i of this.heightInfo) {
            h += i;
        }
        return h;
    }
    /**
     * check whether a given time is valid. If invalid, returns the fallback
     */
    validate(time: string, fallback: string) {
        if (time && time.length >= 3 && time.indexOf(':') > 0) {
            return time;
        } else {
            return fallback;
        }
    }

    increTime(time: string) {
        const sep = time.split(' ')[0].split(':');
        const hr = parseInt(sep[0]);
        const min = parseInt(sep[1]);
        return (
            hr +
            ((min + 30) / 60 >= 1 ? 1 : 0) +
            ':' +
            ((min + 30) % 60 < 10 ? '0' + ((min + 30) % 60) : (min + 30) % 60)
        );
    }
}
