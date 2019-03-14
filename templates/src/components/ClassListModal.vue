<template>
  <div
    class="modal fade"
    tabindex="-1"
    role="dialog"
    aria-labelledby="exampleModalLabel"
    aria-hidden="true"
  >
    <div class="modal-dialog modal-lg" role="document">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">{{course.department}} {{course.number}} {{course.title}}</h5>
          <button type="button" class="close" data-dismiss="modal" aria-label="Close">
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
        <div class="modal-body">
          <div>{{course.type}}</div>
          <table style="color:#a0a0a0;font-size:11px;width:80%">
            <tr v-for="sec in sections" :key="sec">
              <td style="width:10%">Section:&nbsp;{{sec[0]}}</td>
              <td v-if="sec[1] != ''" style="width:13%">{{sec[1]}}</td>
              <td style="width:13%">{{sec[2]}}</td>
              <td style="width:13%">{{sec[3]}}</td>
              <td style="width:16.7%">{{sec[4]}}</td>
              <td style="width:5%">{{sec[5]}}</td>
              <td style="width:13%">{{sec[6]}}</td>
            </tr>
          </table>

          <br>
          <div>{{course.description}}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { CourseRecord } from '../models/CourseRecord.js';
export default {
    props: {
        course: CourseRecord
    },
    computed: {
        sections() {
            let secs = [];
            for (let i = 0; i < this.course.section.length; i++) {
                secs.push([
                    this.course.section[i],
                    this.course.topic[i],
                    this.course.instructor[i].join(', '),
                    this.course.days[i],
                    this.course.room[i],
                    this.course.status[i],
                    this.course.enrollment[i] + '/' + this.course.enrollment_limit[i]
                ]);
            }
            return secs;
        }
    }
};
</script>

<style>
</style>
