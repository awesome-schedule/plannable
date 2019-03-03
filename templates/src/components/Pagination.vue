<template>
  <nav aria-label="...">
    <ul class="pagination justify-content-center">
      <li v-bind:class="'page-item' + (idx <= 0 ? ' disabled' : '')">
        <a
          class="page-link"
          href="#"
          tabindex="-1"
          aria-disabled="true"
          v-on:click="switchPage(idx - 1)"
        >Previous</a>
      </li>
      <li
        v-for="index in indices"
        :key="index"
        v-bind:class="'page-item' + (idx === index ? ' active' : '')"
      >
        <a class="page-link" href="#" v-on:click="switchPage(index)">
          {{ index + 1 }}
          <span v-if="idx === index" class="sr-only">(current)</span>
        </a>
      </li>
      <li v-bind:class="'page-item' + (idx >= indices.length - 1 ? ' disabled' : '')">
        <a class="page-link" v-on:click="switchPage(idx + 1)">Next</a>
      </li>
    </ul>
  </nav>
</template>

<script>
export default {
    props: {
        indices: Array
    },
    data() {
        return {
            idx: 0
        };
    },
    methods: {
        switchPage(idx) {
            if (idx >= 0 && idx < this.indices.length) {
                this.idx = idx;
                this.$emit('switch_page', idx);
            }
        }
    }
};
</script>

