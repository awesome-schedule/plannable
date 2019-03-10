<template>
  <div
    v-if="schedule !== null"
    style="width: 98%; margin: auto auto"
    v-on:keyup.esc="$emit('close')"
    id="active-list"
  >
    <div>
      <h5 class="card-title">Current Schedule</h5>
      <p class="card-text">{{ schedule.title }}</p>
    </div>
    <ul class="list-group">
      <a
        class="list-group-item list-group-item-action"
        data-toggle="popover"
        data-html="true"
        data-placement="right"
        v-for="course in schedule.All"
        v-bind:data-content="section(course)"
        v-bind:data-title="course.title"
        v-bind:key="course.id"
      >
        <table style="width:100%">
          <tr>
            <td style="width:80%">{{ `${course.department} ${course.number} ${course.type}` }}</td>
            <td>
              <button
                type="button"
                class="close"
                data-dismiss="modal"
                aria-label="Close"
                @click="$emit('remove_course', course)"
              >
                <span aria-hidden="true">&times;</span>
              </button>
            </td>
          </tr>
        </table>
      </a>
    </ul>
    <!-- <div class="card-body">
      <a href="#" class="card-link">Card link</a>
      <a href="#" class="card-link">Another link</a>
    </div>-->
  </div>
</template>

<script>
import { Course } from '../models/CourseRecord.js';
export default {
    props: {
        schedule: Object
    },
    methods: {
        /**
         * @param {Course} course
         */
        section(course) {
            if (course.default) return 'Any Section';
            else {
                return `${course.section}: ${course.days} <br/> ${course.instructor.join(
                    ','
                )} <br/> ${course.room}`;
            }
        }
    }
};
</script>

<style>
</style>
