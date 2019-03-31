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
                    <div class="placeholder">{{ mon }}</div>
                    <div class="placeholder">{{ tue }}</div>
                    <div class="placeholder">{{ wed }}</div>
                    <div class="placeholder">{{ thu }}</div>
                    <div class="placeholder">{{ fri }}</div>
                    <div
                        v-for="(item, i) in items"
                        :key="i"
                        class="placeholder"
                        style="z-index:1"
                    ></div>

                    <course-block
                        v-for="course in courses.Monday"
                        :key="course.key + 'Mo'"
                        :course="course"
                        :height-info="heightInfo"
                        :full-height="fullHeight"
                        :show-time="showTime"
                        :show-room="showRoom"
                        :show-instructor="showInstructor"
                        :absolute-earliest="absoluteEarliest"
                        style="left:0%"
                    ></course-block>
                    <course-block
                        v-for="course in courses.Tuesday"
                        :key="course.key + 'Tu'"
                        :course="course"
                        :height-info="heightInfo"
                        :full-height="fullHeight"
                        :show-time="showTime"
                        :show-room="showRoom"
                        :show-instructor="showInstructor"
                        :absolute-earliest="absoluteEarliest"
                        style="left:20%"
                    ></course-block>
                    <course-block
                        v-for="course in courses.Wednesday"
                        :key="course.key + 'We'"
                        :course="course"
                        :height-info="heightInfo"
                        :full-height="fullHeight"
                        :show-time="showTime"
                        :show-room="showRoom"
                        :show-instructor="showInstructor"
                        :absolute-earliest="absoluteEarliest"
                        style="left:40%"
                    ></course-block>
                    <course-block
                        v-for="course in courses.Thursday"
                        :key="course.key + 'Th'"
                        :course="course"
                        :height-info="heightInfo"
                        :full-height="fullHeight"
                        :show-time="showTime"
                        :show-room="showRoom"
                        :show-instructor="showInstructor"
                        :absolute-earliest="absoluteEarliest"
                        style="left:60%"
                    ></course-block>
                    <course-block
                        v-for="course in courses.Friday"
                        :key="course.key + 'Fr'"
                        :course="course"
                        :height-info="heightInfo"
                        :full-height="fullHeight"
                        :show-time="showTime"
                        :show-room="showRoom"
                        :show-instructor="showInstructor"
                        :absolute-earliest="absoluteEarliest"
                        style="left:80%"
                    ></course-block>
                </div>
            </td>
        </tr>
    </table>
</template>

<script>
import Vue from 'vue';
import CourseBlock from './CourseBlock.vue';
import Schedule from '../models/Schedule.js';
export default Vue.extend({
    name: 'GridSchedule',
    components: {
        CourseBlock
    },
    props: {
        courses: Schedule,
        showTime: Boolean,
        showRoom: Boolean,
        showInstructor: Boolean,
        partialHeight: Number,
        fullHeight: Number,
        earliest: String,
        latest: String
    },
    data() {
        return {
            mon: window.screen.width > 450 ? 'Monday' : 'Mon',
            tue: window.screen.width > 450 ? 'Tuesday' : 'Tue',
            wed: window.screen.width > 450 ? 'Wednesday' : 'Wed',
            thu: window.screen.width > 450 ? 'Thursday' : 'Thu',
            fri: window.screen.width > 450 ? 'Friday' : 'Fri'
        };
    },
    computed: {
        /**
         * return the block in which the earliest class starts, the 8:00 block is zero
         * return 0 if no class
         */
        earliestBlock() {
            let earliest = 817;
            for (const key of Schedule.days) {
                for (const course of this.courses[key]) {
                    const temp = this.timeToNum(course.start, true);
                    if (temp < earliest && course !== undefined && course !== null) {
                        earliest = temp;
                    }
                }
            }
            return earliest === 817 ? 0 : earliest;
        },
        /**
         * return the block in which the latest class ends, the 8:00 block is zero
         */
        latestBlock() {
            let latest = 0;
            for (const key of Schedule.days) {
                for (const course of this.courses[key]) {
                    const temp = this.timeToNum(course.end, false);
                    if (temp > latest && course !== undefined && course !== null) {
                        latest = temp;
                    }
                }
            }
            return latest === 817 ? (19 - 8) * 2 : latest;
        },
        /**
         * return the block in which the schedule starts with
         */
        absoluteEarliest() {
            const early =
                this.earliest === null || this.earliest === undefined
                    ? '8:00'
                    : this.earliest
                          .split(':')
                          .slice(0, 2)
                          .join(':');
            console.log('early');
            console.log(this.earliest);
            if (this.timeToNum(early, true) > this.earliestBlock) {
                return this.earliestBlock;
            } else {
                return this.timeToNum(this.earliest, true);
            }
        },
        /**
         * return the block in which the schedule ends with
         */
        absoluteLatest() {
            const late =
                this.latest === null || this.latest === undefined
                    ? '19:00'
                    : this.latest
                          .split(':')
                          .slice(0, 2)
                          .join(':');
            if (this.timeToNum(late, false) < this.latestBlock) {
                return this.latestBlock;
            } else {
                return this.timeToNum(this.latest, false);
            }
        },
        /**
         * computes the number of rows needs
         */
        numRow() {
            let num = 0;
            for (let i = this.absoluteEarliest; i <= this.absoluteLatest; i++) {
                num += 1;
            }
            return num;
        },
        hours() {
            let curTime = '';
            if (this.absoluteEarliest % 2 == 0) {
                curTime = this.absoluteEarliest / 2 + 8 + ':00';
            } else {
                curTime = (this.absoluteEarliest - 1) / 2 + 8 + ':30';
            }

            const time = [];
            const reducedTime = [];
            for (let i = this.absoluteEarliest; i <= this.absoluteLatest; i++) {
                time.push(curTime);
                curTime = this.increTime(curTime);
                reducedTime.push(i % 2 !== 0 ? '' : i / 2 + 8);
            }

            return window.screen.width > 450 ? time : reducedTime;
        },
        items() {
            const arr = [];
            const numBlocks = (this.absoluteLatest - this.absoluteEarliest + 1) * 5;
            for (let i = 0; i < numBlocks; i++) {
                arr.push(i + 1);
            }

            return arr;
        },
        heightInfo() {
            const info = new Array(this.numRow);
            info.fill(this.partialHeight);
            const earliest = this.absoluteEarliest;
            for (const key of Schedule.days) {
                for (const course of this.courses[key]) {
                    const startTime = this.timeToNum(course.start, true);
                    const endTime = this.timeToNum(course.end, false);
                    for (let i = startTime; i <= endTime; i++) {
                        info[i - earliest] = this.fullHeight;
                    }
                }
            }
            return info;
        },
        mainHeight() {
            let h = 0;
            for (const i of this.heightInfo) {
                h += i;
            }
            return h;
        }
    },
    methods: {
        /**
         * Increase the time in string by 30 minutes and return
         */
        increTime(time) {
            const sep = time.split(':');
            const hr = parseInt(sep[0]);
            const min = parseInt(sep[1]);
            return (
                hr +
                ((min + 30) / 60 >= 1 ? 1 : 0) +
                ':' +
                ((min + 30) % 60 < 10 ? '0' + ((min + 30) % 60) : (min + 30) % 60)
            );
        },
        /**
         * timeToNum
         * convert time in 24 hours to number of time blocks relative to the    8:00 block
         * @param time time in 24 hours
         * @param start boolean that indicates this is a start time or end time
         */
        timeToNum(time, start) {
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
    }
});
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
    background-color: rgba(255, 255, 255, 0.8);
    padding: 12px 0 10px;
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
</style>
