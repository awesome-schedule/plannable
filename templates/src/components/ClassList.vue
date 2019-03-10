<template>
  <div id="class-list" class="card" style="width:100%">
    <div class="card-body">
      <div v-for="crs in courses" :key="crs.key">
        <div
          @click="select(crs, 0)"
          style="cursor: pointer"
          v-bind:data-content="crs.description"
          v-bind:data-title="crs.title"
          data-toggle="popover"
          data-html="true"
          data-placement="right"
        >
          <p style="margin:0">{{crs.department}} {{crs.number}} {{crs.type}}</p>
          <p style="font-size: 0.85rem; margin: 0">{{crs.title}}</p>
        </div>
        <div
          class="list-group list-group-flush"
          style="width: 100%"
          v-for="(sec, idx) in crs.section"
          :key="sec"
        >
          <a
            @click="select(crs, idx)"
            class="list-group-item list-group-item-action"
            v-bind:class="{active: selected[crs.key] === idx}"
            style="padding: 2px; cursor: pointer"
          >
            <p
              class="subtitle"
              v-bind:class="{w: selected[crs.key] === idx}"
            >{{sec}} {{crs.days[idx]}}</p>
            <p
              class="subtitle"
              v-if="crs.topic[idx].length > 0"
              v-bind:class="{w: selected[crs.key] === idx}"
            >{{crs.topic[idx]}}</p>
            <p
              class="subtitle"
              v-bind:class="{w: selected[crs.key] === idx}"
            >{{ crs.instructor[idx].join(", ") }} {{ crs.room[idx] }}</p>
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
    props: {
        courses: Array
    },
    data() {
        return {
            selected: {}
        };
    },
    methods: {
        select(crs, idx) {
            const key = crs.key;
            if (this.selected[key] === idx) {
                this.selected[key] = undefined;
                this.$emit('remove_course', crs.getCourse(idx));
            } else {
                this.selected[key] = idx;
                this.$emit('add_course', crs.getCourse(idx));
            }
            this.$forceUpdate();
        }
    }
};
</script>

<style scoped>
.subtitle {
    margin: 0;
    font-size: 0.7rem;
}

.w {
    color: white;
}
</style>
