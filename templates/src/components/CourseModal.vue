<template>
  <div id="course-modal-div" class="modal fade" tabindex="-1" role="dialog">
    <div class="modal-dialog modal-dialog-centered" role="document">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">{{course.department}} {{course.number}} {{course.title}}</h5>
          <button type="button" class="close" data-dismiss="modal" aria-label="Close">
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
        <div class="modal-body">
          <p>{{course.description}}</p>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
export default {
    props: {
        course: Object
    }
};
</script>

<style>
</style>
