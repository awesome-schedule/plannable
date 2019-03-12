<template>
  <div
    v-bind:style="{
        'margin-top': startPx  + 'px',
        'position': 'absolute',
        'width': '20%',
        'height': endPx - startPx + 'px',
        'background-color': course.background-color,
        'z-index': '2',
        'color' : 'white',
        }"
  >
  <p class="mt-2 ml-2" style="color:white; font-size:13px">{{course.title}}</p>
  <p class="ml-2" style="color:#e0e0e0; font-size:11px">{{course.days}}</p>
  <p class="ml-2" style="color:#e0e0e0; font-size:11px">{{course.instructor}}</p>
  <p class="ml-2" style="color:#e0e0e0; font-size:11px">{{course.room}}</p>
  </div>
</template>

<script>
import { Course } from '../models/CourseRecord.js';
export default {
    name: 'CourseBlock',
    props: {
        course: Course,
        heightInfo: Array
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
                    start += ((parseFloat(t[1]) - 30) / 30) * 60;
                }
            }else{
                start += parseFloat(t[1]) / 30 * 60;
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
                    end += ((parseFloat(t[1]) - 30) / 30) * 60;
                }
            }else{
                end += parseFloat(t[1]) / 30 * 60;
            }
            return end;
        }
    }
};
</script>

<style>
</style>
