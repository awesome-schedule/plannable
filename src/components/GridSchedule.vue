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
                            :style="
                                `left:${idx * 20 +
                                    (20 / numConflict(scheduleBlock, day, false)) *
                                        numConflict(scheduleBlock, day, true)}%; width: ${20 /
                                    numConflict(scheduleBlock, day, false)}%`
                            "
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
import { to12hr, parseTimeAsInt } from '../models/Utils';
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

    // occupy = Array((5 * 24 * 60) / 5).fill(0);

    /**
     * return the block in which the earliest class starts, the 8:00 block is zero
     * return 0 if no class
     */
    get earliestBlock() {
        let earliest = 817;
        for (const key in this.schedule.days) {
            for (const course of this.schedule.days[key]) {
                const temp = this.timeToNum(course.start, true);
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
                const temp = this.timeToNum(course.end, false);
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

        if (this.timeToNum(early, true) > this.earliestBlock) {
            return this.earliestBlock;
        } else {
            return this.timeToNum(early, true);
        }
    }
    /**
     * return the block in which the schedule ends with
     */
    get absoluteLatest() {
        const late = this.validate(this.latest, '19:00');
        if (this.timeToNum(late, false) < this.latestBlock) {
            return this.latestBlock;
        } else {
            return this.timeToNum(late, false);
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
                const startTime = this.timeToNum(course.start, true);
                const endTime = this.timeToNum(course.end, false);
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

    timeToNum(time: string, start: boolean) {
        const sep = time.split(':');
        const min = parseInt(sep[1]);
        let t = (parseInt(sep[0]) - 8) * 2;
        if (start) {
            if (min >= 30) {
                t += 2;
            } else {
                t += 1;
            }
        } else {
            if (min > 30) {
                t += 2;
            } else if (min > 0) {
                t += 1;
            }
        }
        return t - 1;
    }

    numConflict(scheduleBlock: ScheduleBlock, day: string, previousClassOnly: boolean) {
        let count = 0;
        for (const sb of this.schedule.days[day]) {
            let sc: Section;
            if (sb.section instanceof Section) {
                sc = sb.section;
            } else if (sb.section instanceof Array) {
                sc = sb.section[0];
            } else {
                continue;
            }

            if (scheduleBlock.section instanceof Section) {
                if (sc.equals(scheduleBlock.section) && previousClassOnly) {
                    break;
                }
                for (const m1 of sc.meetings) {
                    if (m1.days.indexOf(day) !== -1) {
                        for (const m2 of scheduleBlock.section.meetings) {
                            if (m2.days.indexOf(day) !== -1) {
                                if (this.checkConflict(m1.days, m2.days)) {
                                    count++;
                                }
                            }
                        }
                    }
                }
            }
        }
        console.log(day + ' ' + count);
        return count;
    }

    checkConflict(s1: string, s2: string) {
        const [d1, start1, , end1] = s1.split(' ');
        const [d2, start2, , end2] = s2.split(' ');

        const tb1 = parseTimeAsInt(start1, end1);
        const tb2 = parseTimeAsInt(start2, end2);

        if (
            (tb1[0] >= tb2[0] && tb1[0] < tb2[1]) ||
            (tb1[1] > tb2[0] && tb1[1] <= tb2[1]) ||
            (tb2[0] >= tb1[0] && tb2[0] < tb1[1]) ||
            (tb2[1] > tb1[0] && tb2[1] <= tb1[1])
        ) {
            return true;
        }

        return false;
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
