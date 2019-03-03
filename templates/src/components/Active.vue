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
        v-bind:data-content="course.title + '\n' + course.type"
        v-for="course in schedule.All"
        v-bind:key="course.id"
      >
        <table style="width:100%">
          <tr>
            <td style="width:80%">{{ `${course.department} ${course.number}` }}</td>
            <td>
              <button
                type="button"
                class="close"
                data-dismiss="modal"
                aria-label="Close"
                v-on:click="$emit('remove_course', course.id)"
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
export default {
    props: {
        schedule: Object
    }
};
</script>

<style>
</style>
