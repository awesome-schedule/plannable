<template>
  <div v-if="schedule !== null" style="width: 98%; margin: auto auto">
    <div>
      <h5 class="card-title">Current Schedule</h5>
      <p class="card-text">{{ schedule.title }}</p>
    </div>
    <ul class="list-group">
      <a
        class="list-group-item list-group-item-action"
        data-toggle="popover"
        data-placement="right"
        v-bind:data-content="course.title"
        v-for="course in schedule.All"
        v-bind:key="course.id"
      >{{ course.department + course.number }}</a>
    </ul>
    <!-- <div class="card-body">
      <a href="#" class="card-link">Card link</a>
      <a href="#" class="card-link">Another link</a>
    </div>-->
  </div>
</template>

<script>
export default {
    props: {
        schedule: Object
    }
};
</script>

<style>
</style>
