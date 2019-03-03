<template>
  <div v-if="schedule !== null" class="card" style="width: 98%; margin: auto auto">
    <!-- <img class="card-img-top" src="..." alt="Card image cap"> -->
    <div class="card-body">
      <h5 class="card-title">Current Schedule</h5>
      <p class="card-text">{{ schedule.title }}</p>
    </div>
    <ul class="list-group list-group-flush">
      <li
        class="list-group-item"
        v-for="course in schedule.All"
        v-bind:key="course.id"
      >{{ course.title }}</li>
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
