/**
 * the component for rendering a schedule (with courses and events)
 *
 * @author Kaiying Shan
 */

import CourseBlock from './CourseBlock.vue';
import Meta from '../models/Meta';
import { to12hr, timeToNum } from '../utils';
import { Component } from 'vue-property-decorator';
import Store from '../store';

@Component({
    components: {
        CourseBlock
    }
})
export default class GridSchedule extends Store {
    mon = window.screen.width > 450 ? 'Monday' : 'Mon';
    tue = window.screen.width > 450 ? 'Tuesday' : 'Tue';
    wed = window.screen.width > 450 ? 'Wednesday' : 'Wed';
    thu = window.screen.width > 450 ? 'Thursday' : 'Thu';
    fri = window.screen.width > 450 ? 'Friday' : 'Fri';
    // note: we need Schedule.days because it's an array that keeps the keys in order
    days = Meta.days;

    /**
     * return the block in which the earliest class starts, the 8:00 block is zero
     * return 0 if no class
     */
    get earliestBlock() {
        let earliest = 817;
        const schedule = this.schedule.currentSchedule;
        for (const key in schedule.days) {
            for (const course of schedule.days[key]) {
                const temp = timeToNum(course.start);
                if (temp < earliest && course !== undefined && course !== null) {
                    earliest = temp;
                }
            }
        }
        return earliest === 817 ? 0 : earliest;
    }
    /**
     * return the block in which the latest class ends, the 8:00 block is zero
     */
    get latestBlock() {
        let latest = 0;
        const schedule = this.schedule.currentSchedule;
        for (const key in schedule.days) {
            for (const course of schedule.days[key]) {
                const temp = timeToNum(course.end);
                if (temp > latest && course !== undefined && course !== null) {
                    latest = temp;
                }
            }
        }
        return latest === 817 ? (19 - 8) * 2 : latest;
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
        const numBlocks = (this.absoluteLatest - this.absoluteEarliest + 1) * 5;
        for (let i = 0; i < numBlocks; i++) {
            arr.push(i + 1);
        }
        return arr;
    }
    get heightInfo() {
        const info: number[] = new Array(this.numRow);
        info.fill(this.display.partialHeight);
        const earliest = this.absoluteEarliest;
        const schedule = this.schedule.currentSchedule;
        for (const key in schedule.days) {
            for (const course of schedule.days[key]) {
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
