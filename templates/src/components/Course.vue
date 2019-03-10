<template>
  <li
    class="single-event"
    v-bind:data-start="course.start"
    v-bind:data-end="course.end"
    v-bind:data-content="course.title"
    v-bind:data-event="`event-${course.color + 1}`"
    v-on:click="triggerModal"
  >
    <em
      style="margin-left:5%;font-style:normal;font-size: 1rem;"
    >{{course.department}} {{course.number}}</em>
    <br>
    <em
      style="margin-left:5%;font-style:normal;font-size: 0.9rem;color:#e0e0de;line-height:1px"
    >{{course.start}}-{{course.end}}</em>
    <br>
    <em
      style="margin-left:5%;font-style:normal;font-size: 0.9rem;color:#e0e0de;line-height:1px"
    >{{course.room}}</em>
    <!-- </a> -->
    <!-- <div class="modal fade" id="exampleModal" tabindex="-1" role="dialog" aria-labelledby="exampleModalLabel" aria-hidden="true">
        <div class="modal-dialog" role="document">
            <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="exampleModalLabel">{{title}}</h5>
                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                <span aria-hidden="true">&times;</span>
                </button>
            </div>
            <div class="modal-body">
                ...
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
            </div>
            </div>
        </div>
    </div>-->
    <!-- <course-modal v-if="clicked" v-bind:department="department" v-bind:number="number" v-bind:title="title" v-bind:description="description"></course-modal> -->
  </li>
</template>

<script>
export default {
    name: 'Course',
    props: {
        course: Object
    },
    data() {
        return {
            // clicked : false,
        };
    },
    methods: {
        triggerModal() {
            this.$parent.$emit('trigger-modal', this.course.id);
            console.log(this.$parent);
        }
    }
};
</script>

<style>
</style>
