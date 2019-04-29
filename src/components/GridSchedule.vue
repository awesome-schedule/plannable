<template>
    <table style="width:100%">
        <tr style="width:100%">
            <td style="width:5%">
                <div
                    class="grid-container time mb-3"
                    :style="{
                        'grid-template-columns': 'auto',
                        width: '100%',
                        height: mainHeight,
                        'grid-template-rows': heightInfo.reduce(
                            (acc, x) => acc + (x + 'px '),
                            '35px '
                        )
                    }"
                >
                    <div></div>
                    <div v-for="(hour, i) in hours" :key="i">{{ hour }}</div>
                </div>
            </td>
            <td>
                <div
                    id="grid"
                    class="grid-container main mb-3"
                    :style="{
                        'grid-template-columns': '20% 20% 20% 20% 20%',
                        position: 'relative',
                        'grid-template-rows': heightInfo.reduce(
                            (acc, x) => acc + (x + 'px '),
                            '48px '
                        ),
                        height: mainHeight
                    }"
                >
                    <div class="placeholder day">{{ mon }}</div>
                    <div class="placeholder day">{{ tue }}</div>
                    <div class="placeholder day">{{ wed }}</div>
                    <div class="placeholder day">{{ thu }}</div>
                    <div class="placeholder day">{{ fri }}</div>
                    <div
                        v-for="(item, i) in items"
                        :key="i"
                        class="placeholder"
                        style="z-index:1"
                    ></div>
                    <!-- note: template element removes the need to wrap CourseBlock components in a HTML element -->
                    <template v-for="(day, idx) in days">
                        <course-block
                            v-for="(scheduleBlock, _) in schedule.days[day]"
                            :key="day + _"
                            :schedule-block="scheduleBlock"
                            :height-info="heightInfo"
                            :full-height="fullHeight"
                            :show-time="showTime"
                            :show-room="showRoom"
                            :show-instructor="showInstructor"
                            :absolute-earliest="absoluteEarliest"
                            :style="style(idx, scheduleBlock, day)"
                            :day="day"
                        ></course-block>
                    </template>
                </div>
            </td>
        </tr>
    </table>
</template>

<script lang="ts">
import CourseBlock from './CourseBlock.vue';
import Schedule from '../models/Schedule';
import Meta from '../models/Meta';
import { to12hr, timeToNum } from '../models/Utils';
import { Vue, Component, Prop } from 'vue-property-decorator';
import { parse } from 'path';
import ScheduleBlock from '../models/ScheduleBlock';
import Section from '../models/Section';

@Component({
    components: {
        CourseBlock
    }
})
export default class GridSchedule extends Vue {
    @Prop(Object) readonly schedule!: Schedule;
    @Prop(Boolean) readonly showTime!: boolean;
    @Prop(Boolean) readonly showRoom!: boolean;
    @Prop(Boolean) readonly showInstructor!: boolean;
    @Prop(Number) readonly partialHeight!: number;
    @Prop(Number) readonly fullHeight!: number;
    @Prop(String) readonly earliest!: string;
    @Prop(String) readonly latest!: string;
    @Prop(Boolean) readonly timeOptionStandard!: boolean;

    name = 'GridSchedule';

    mon = window.screen.width > 450 ? 'Monday' : 'Mon';
    tue = window.screen.width > 450 ? 'Tuesday' : 'Tue';
    wed = window.screen.width > 450 ? 'Wednesday' : 'Wed';
    thu = window.screen.width > 450 ? 'Thursday' : 'Thu';
    fri = window.screen.width > 450 ? 'Friday' : 'Fri';
    // note: we need Schedule.days because it's an array that keeps the keys in order
    days = Meta.days;

    style(idx: number, scheduleBlock: ScheduleBlock, day: string) {
        let left = idx * 20;
        let width = 20;
        const numCfl = scheduleBlock.pathDepth;
        if (numCfl !== 0) {
            left += (20 / (numCfl + 1)) * scheduleBlock.depth;
            width = 20 / (numCfl + 1);
        }
        return { left: left + '%', width: width + '%' };
    }

    /**
     * return the block in which the earliest class starts, the 8:00 block is zero
     * return 0 if no class
     */
    get earliestBlock() {
        let earliest = 817;
        for (const key in this.schedule.days) {
            for (const course of this.schedule.days[key]) {
                const temp = timeToNum(course.start, true);
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
        for (const key in this.schedule.days) {
            for (const course of this.schedule.days[key]) {
                const temp = timeToNum(course.end, false);
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
        const early = this.validate(this.earliest, '8:00');

        if (timeToNum(early, true) > this.earliestBlock) {
            return this.earliestBlock;
        } else {
            return timeToNum(early, true);
        }
    }
    /**
     * return the block in which the schedule ends with
     */
    get absoluteLatest() {
        const late = this.validate(this.latest, '19:00');
        if (timeToNum(late, false) < this.latestBlock) {
            return this.latestBlock;
        } else {
            return timeToNum(late, false);
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

        return window.screen.width > 450 ? (this.timeOptionStandard ? stdTime : time) : reducedTime;
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
        info.fill(this.partialHeight);
        const earliest = this.absoluteEarliest;
        for (const key in this.schedule.days) {
            for (const course of this.schedule.days[key]) {
                const startTime = timeToNum(course.start, true);
                const endTime = timeToNum(course.end, false);
                for (let i = startTime; i <= endTime; i++) {
                    info[i - earliest] = this.fullHeight;
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
</script>

<style>
.grid-container {
    display: grid;
    grid-gap: 0px;
    background-color: white;
    padding: 0px;
}

.main {
    border-right: 0.7px solid #e5e3dc;
    border-bottom: 0.7px solid #e5e3dc;
}

.placeholder {
    font-size: 14px;
    border-left: 0.7px solid #e5e3dc;
    border-top: 0.7px solid #e5e3dc;
    text-align: center;
}

.time {
}

.time > div {
    text-align: right;
    font-size: 10px;
}

.item1 {
    grid-column: 1 / 3;
}

.day {
    padding-top: 10px;
}
</style>
