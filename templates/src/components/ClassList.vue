<template>
  <div class="card" style="width:100%">
    <div class="card-body" style="width:100%;padding:2%;">
      <div v-for="crs in courses" :key="crs.id" style="width:100%">
        <table style="width:100%">
          <tr>
            <td style="width:80%">
              <p style="margin:0">{{crs.department}} {{crs.number}}</p>
              <p style="font-size:0.7rem">{{crs.title}}</p>
            </td>
            <td>
                <button type="button" class="close" data-dismiss="modal" aria-label="Close" v-on:click="$emit('add_course', crs)" style="align:center">
                <span aria-hidden="true">+</span>
                </button>
            </td>
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
