<template>
  <table style="width:100%">
    <tr style="width:100%">
      <td style="width:5%">
        <div
          class="grid-container time mb-3"
          v-bind:style="{
            'grid-template-columns': 'auto',
            'width' : '100%', 
            'grid-template-rows': heightInfo.reduce((acc, x) => acc + (x + 'px '), '35px ')
          }"
        >
          <div></div>
          <div v-for="hour in hours" :key="hour">{{hour}}</div>
        </div>
      </td>
      <td>
        <div
          class="grid-container main mb-3"
          v-bind:style="{
            'grid-template-columns': '20% 20% 20% 20% 20%',
            'position': 'relative', 
            'grid-template-rows': heightInfo.reduce((acc, x) => acc + (x + 'px '), '48px ')
          }"
          id="grid"
        >
          <div class="day">
            <br>Monday
          </div>
          <div class="day">
            <br>Tuesday
          </div>
          <div class="day">
            <br>Wednesday
          </div>
          <div class="day">
            <br>Thursday
          </div>
          <div class="day">
            <br>Friday
          </div>
          <div v-for="item in items" :key="item" style="z-index:1"></div>

          <course-block
            v-for="course in courses.Monday"
            :key="course.key + 'Mo' "
            v-bind:course="course"
            v-bind:heightInfo="heightInfo"
            v-bind:fullHeight="fullHeight"
            style="left:0%"
          ></course-block>
          <course-block
            v-for="course in courses.Tuesday"
            :key="course.key + 'Tu'"
            v-bind:course="course"
            v-bind:heightInfo="heightInfo"
            v-bind:fullHeight="fullHeight"
            style="left:20%"
          ></course-block>
          <course-block
            v-for="course in courses.Wednesday"
            :key="course.key + 'We'"
            v-bind:course="course"
            v-bind:heightInfo="heightInfo"
            v-bind:fullHeight="fullHeight"
            style="left:40%"
          ></course-block>
          <course-block
            v-for="course in courses.Thursday"
            :key="course.key + 'Th'"
            v-bind:course="course"
            v-bind:heightInfo="heightInfo"
            v-bind:fullHeight="fullHeight"
            style="left:60%"
          ></course-block>
          <course-block
            v-for="course in courses.Friday"
            :key="course.key + 'Fr'"
            v-bind:course="course"
            v-bind:heightInfo="heightInfo"
            v-bind:fullHeight="fullHeight"
            style="left:80%"
          ></course-block>
        </div>
      </td>
    </tr>
  </table>
</template>

<script>
import CourseBlock from './CourseBlock.vue';
import { Schedule } from '../models/Schedule.js';

export default {
    name: 'GridSchedule',
    props: {
        courses: Schedule
    },

    components: {
        CourseBlock
    },

    data() {
        let partial = 20;
        let full = 50;

        let arr = [];
        for (let i = 0; i < 115; i++) {
            arr.push(i + 1);
        }

        let time = [];
        for (let i = 8; i < 19; i++) {
            time.push((i / 10 > 0 ? i : 0 + i) + ': 00');
            time.push((i / 10 > 0 ? i : 0 + i) + ': 30');
        }

        time.push('19: 00');

        return {
            partialHeight: partial,
            fullHeight: full,
            items: arr,
            hours: time
        };
    },

    computed: {
        heightInfo() {
            let info = new Array(23);
            info.fill(this.partialHeight);

            for (const key of Schedule.days) {
                for (const course of this.courses[key]) {
                    let t1 = course.start.split(':');
                    let t2 = course.end.split(':');
                    let h1 = (parseInt(t1[0]) - 8) * 2 + (parseInt(t1[1]) >= 30 ? 1 : 0);
                    let h2 =
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
};
</script>

<style scoped>
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

.main > div {
    background-color: rgba(255, 255, 255, 0.8);
    padding: 0px 0;
    font-size: 10px;
    border-left: 0.7px solid #e5e3dc;
    border-top: 0.7px solid #e5e3dc;
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
    text-align: center;
    border-top: 40%;
    vertical-align: middle;
}

.time {
}
</style>
