<template>
  <div class="card" style="width:100%">
    <div class="card-body">
      <div v-for="crs in courses" :key="crs.id">
        <table style="width:100%; margin-top: 5px; margin-bottom: 5px;">
          <tr>
            <td style="width:80%">
              <p style="margin:0">{{crs.department}} {{crs.number}}</p>
              <p class="subtitle">{{crs.title}}</p>
              <p class="subtitle">{{crs.type}}</p>
              <p
                class="subtitle"
                v-if="crs.topic !== undefined && crs.topic.length > 0"
                style
              >{{crs.topic}}</p>
            </td>
            <td>
              <button
                type="button"
                class="close"
                aria-label="add"
                v-on:click="$emit('add_course', crs)"
                style="align:center"
                role="button"
                data-toggle="popover"
                data-trigger="focus"
                data-content="Added!"
              >
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

<style scoped>
.subtitle {
    margin: 0;
    font-size: 0.7rem;
}
</style>
