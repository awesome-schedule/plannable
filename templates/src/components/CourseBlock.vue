<template>
  <div
    class="courseBlock"
    data-toggle="modal"
    data-target="#modal"
    v-on:click="$parent.$emit('trigger-modal', course)"
    v-bind:style="{
        'margin-top': startPx  + 'px',
        'position': 'absolute',
        'width': '20%',
        'height': endPx - startPx + 'px',
        'background-color': course.backgroundColor,
        'z-index': '2',
        'color' : 'white',
        }"
  >
    <div
      class="mt-2 ml-2"
      style="color:white; font-size:13px"
    >{{course.department}} {{course.number}} {{course.type}}</div>
    <div class="ml-2" style="color:#eaeaea; font-size:11px">{{course.days}}</div>
    <div class="ml-2" style="color:#eaeaea; font-size:11px">{{course.instructor.join(', ')}}</div>
    <div class="ml-2" style="color:#eaeaea; font-size:11px">{{course.room}}</div>
  </div>
</template>

<script>
import { Course } from '../models/CourseRecord.js';
export default {
    name: 'CourseBlock',
    props: {
        course: Course,
        heightInfo: Array,
        fullHeight: Number,
    },
    computed: {
        startPx: function() {
            let start = 48;
            let t = this.course.start.split(':');
            let temp = (parseFloat(t[0]) - 8) * 2;
            for (let i = 0; i < temp; i++) {
                start += this.heightInfo[i];
            }
            if (parseInt(t[1]) >= 30) {
                start += this.heightInfo[temp];
                if (parseInt(t[1]) > 30) {
                    start += ((parseFloat(t[1]) - 30) / 30) * this.fullHeight;
                }
            } else {
                start += (parseFloat(t[1]) / 30) * this.fullHeight;
            }
            return start;
        },

        endPx: function() {
            let end = 48;
            let t = this.course.end.split(':');
            let temp = (parseFloat(t[0]) - 8) * 2;
            for (let i = 0; i < temp; i++) {
                end += this.heightInfo[i];
            }
            if (parseInt(t[1]) >= 30) {
                end += this.heightInfo[temp];
                if (parseInt(t[1]) > 30) {
                    end += ((parseFloat(t[1]) - 30) / 30) * this.fullHeight;
                }
            } else {
                end += (parseFloat(t[1]) / 30) * this.fullHeight;
            }
            return end;
        }
    }
};
</script>

<style scoped>
.courseBlock:hover{
    box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19);
}
</style>
