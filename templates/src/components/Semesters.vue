<template>
  <div class="dropdown-menu" aria-labelledby="dropdownMenuButton">
    <a
      class="dropdown-item"
      href="#"
      v-for="semester in semesters"
      v-bind:key="semester.id"
    >{{ semester.name }}</a>
  </div>
</template>

<script>
export default {
    props: {
        semesters: Array
    }
};
</script>

<style>
</style>
