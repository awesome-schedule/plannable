<template>
    <table style="width:100%">
        <tr style="width:100%">
            <td style="width:5%">
                <div
                    class="grid-container time mb-3"
                    :style="{
                        'grid-template-columns': 'auto',
                        width: '100%',
                        'grid-template-rows': heightInfo.reduce(
                            (acc, x) => acc + (x + 'px '),
                            '35px '
                        )
                    }"
                >
                    <div></div>
                    <div v-for="hour in hours" :key="hour">{{ hour }}</div>
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
                        )
                    }"
                >
                    <div class="placeholder">Monday</div>
                    <div class="placeholder">Tuesday</div>
                    <div class="placeholder">Wednesday</div>
                    <div class="placeholder">Thursday</div>
                    <div class="placeholder">Friday</div>
                    <div
                        v-for="item in items"
                        :key="item"
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
        fullHeight: Number
    },
    data() {
        const arr = [];
        for (let i = 0; i < 115; i++) {
            arr.push(i + 1);
        }

        const time = [];
        for (let i = 8; i < 19; i++) {
            time.push((i / 10 > 0 ? i : 0 + i) + ': 00');
            time.push((i / 10 > 0 ? i : 0 + i) + ': 30');
        }

        time.push('19: 00');
        return {
            items: arr,
            hours: time
        };
    },
    computed: {
        heightInfo() {
            const info = new Array(23);
            info.fill(this.partialHeight);

            for (const key of Schedule.days) {
                for (const course of this.courses[key]) {
                    const t1 = course.start.split(':');
                    const t2 = course.end.split(':');
                    const h1 = (parseInt(t1[0]) - 8) * 2 + (parseInt(t1[1]) >= 30 ? 1 : 0);
                    const h2 =
                        t2[1] === '00'
                            ? (parseInt(t2[0]) - 8) * 2
                            : (parseInt(t2[0]) - 8) * 2 + (parseInt(t2[1]) > 30 ? 2 : 1);

                    for (let i = h1; i < h2; i++) {
                        info[i] = this.fullHeight;
                    }
                }
            }
            return info;
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
