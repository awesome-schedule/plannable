<template>
  <div class="card" style="width:100%;">
    <div class="card-body">
      <div v-for="crs in courses" :key="crs.id">
        <table>
          <tr>
            <td style="width:80%">
              <p>{{crs.department}} {{crs.number}}</p>
              <br>
              <p>{{crs.description}}</p>
            </td>
            <a v-on:click="$emit('add_course', crs)">+</a>
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
        courses: Object
    }
};
</script>

<style>
</style>
