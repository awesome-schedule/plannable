<template>
  <div id="class-list" class="card" style="width: 100%">
    <div class="card-body" style="padding: 0.25rem">
      <div class="list-group list-group-flush" v-for="crs in courses" :key="crs.key">
        <div
          class="list-group-item list-group-item-action class-title"
          v-bind:data-content="crs.description"
          v-bind:data-title="crs.title"
          data-toggle="collapse"
          v-bind:data-target="`#${crs.key}`"
          @click="collapse(crs.key)"
        >
          <table>
            <tr>
              <td style="padding-right: 0.5rem">
                <i
                  class="fas"
                  v-bind:class="collapsed[crs.key] === undefined ? 'fa-chevron-down' : 'fa-chevron-right'"
                ></i>
              </td>
              <td>
                <h6
                  data-toggle="popover"
                  data-html="true"
                  data-placement="right"
                  style="margin-bottom: 0.25rem"
                >{{crs.department}} {{crs.number}} {{crs.type}}</h6>
                <p style="font-size: 0.85rem; margin: 0">{{crs.title}}</p>
              </td>
            </tr>
          </table>
        </div>
        <a
          style="font-size: 1rem; padding: 0.5rem 1rem"
          @click="select(crs, -1)"
          class="list-group-item list-group-item-action class-section"
          v-bind:class="{active: selected[crs.key] === -1}"
        >Any Section</a>
        <div
          class="list-group collapse show multi-collapse"
          v-for="(sec, idx) in crs.section"
          :key="sec"
          v-bind:id="crs.key"
        >
          <a
            @click="select(crs, idx)"
            class="list-group-item list-group-item-action class-section"
            v-bind:class="{active: isActive(crs.key, idx)}"
          >
            <ul class="list-unstyled class-info">
              <li>{{sec}} {{crs.days[idx]}}</li>
              <li>{{crs.topic[idx]}}</li>
              <li>{{ crs.instructor[idx].join(", ") }} {{ crs.room[idx] }}</li>
            </ul>
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { CourseRecord } from '../models/CourseRecord';
export default {
    props: {
        courses: Array
    },
    data() {
        return {
            selected: {},
            collapsed: {}
        };
    },
    methods: {
        /**
         * @param {CourseRecord} crs
         */
        select(crs, idx) {
            const key = crs.key;
            let course;
            if (idx === -1) {
                this.selected[key] === -1
                    ? (this.selected[key] = undefined)
                    : (this.selected[key] = -1);
            } else {
                if (this.selected[key] instanceof Set) {
                    if (!this.selected[key].delete(idx)) this.selected[key].add(idx);
                } else {
                    this.selected[key] = new Set([idx]);
                }
            }
            this.$emit('update_course', crs.key, this.selected[key]);
            this.$forceUpdate();
        },
        collapse(key) {
            this.collapsed[key] === undefined
                ? (this.collapsed[key] = key)
                : (this.collapsed[key] = undefined);
            this.$forceUpdate();
        },
        isActive(key, idx) {
            return this.selected[key] instanceof Set && this.selected[key].has(idx);
        }
    }
};
</script>

<style scoped>
.subtitle {
    font-size: 0.7rem;
    margin-top: 0;
    margin-bottom: 0;
}

.active {
    color: white !important;
}

.class-title {
    cursor: pointer;
    padding: 0.25rem;
}

.class-section {
    padding: 0.1rem 0 0.1rem 1rem;
    font-size: 0.75rem;
    margin: 0;
    cursor: pointer;
}

.class-info {
    margin: 0;
}
</style>
