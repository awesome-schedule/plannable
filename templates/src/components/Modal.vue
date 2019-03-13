<template>
    <div class="modal fade" tabindex="-1" role="dialog" aria-labelledby="exampleModalLabel" aria-hidden="true">
  <div class="modal-dialog" role="document" v-if="course !== null">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title" id="exampleModalLabel">{{course.department}} {{course.number}} {{course.title}}</h5>
        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
      <div class="modal-body">
        <div style="color:#a0a0a0">
            {{course.type}}
        </div>
        <div style="color:#a0a0a0">
            {{course.days}}
        </div>
        <div style="color:#a0a0a0">
            {{course.room}}
        </div>
        <div style="color:#a0a0a0">
            {{course.instructor.join(', ')}}
        </div>
        <br>
        <div>
            {{course.description}}
        </div>
      </div>
    </div>
  </div>
</div>
</template>

<script>
import {Course} from '../models/CourseRecord.js';
export default {
    props : {
        course : Course
    }
}
</script>

<style>

</style>
