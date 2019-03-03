<template>
  <div class="card" style="width:100%;">
    <div class="card-body">
      <div v-for="crs in courses" :key="crs.id" style="width:100%">
        <table style="width:100%">
          <tr>
            <td style="width:80%">
              <p>{{crs.department}} {{crs.number}}</p>
              <br>
              <p>{{crs.description}}</p>
            </td>
            <button class="btn btn-primary" v-on:click="$emit('add_course', crs)">+</button>
            <td></td>
          </tr>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
export default {
    props: {
        courses: Array
    }
};
</script>

<style>
</style>
