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
                  v-bind:class="collapsed[crs.key] !== undefined ^ isEntering ? 'fa-chevron-down' : 'fa-chevron-right'"
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
              <td v-if="!isEntering" style="padding-left: 0.5rem">
                <button
                  type="button"
                  class="close"
                  aria-label="Close"
                  @click="$emit('remove_course', crs.key)"
                >
                  <span aria-hidden="true">&times;</span>
                </button>
              </td>
            </tr>
          </table>
        </div>
        <div
          class="list-group collapse multi-collapse"
          v-bind:class="{show: isEntering}"
          v-for="(sec, idx) in crs.section"
          :key="sec"
          v-bind:id="crs.key"
        >
          <a
            v-if="idx === 0"
            style="font-size: 1rem; padding: 0.5rem 1rem"
            @click="select(crs, -1)"
            class="list-group-item list-group-item-action class-section"
            v-bind:class="{active: schedule.All[crs.key] === -1}"
          >Any Section</a>
          <a
            @click="select(crs, idx)"
            class="list-group-item list-group-item-action class-section"
            v-bind:class="{active: isActive(crs.key, idx)}"
            @mouseover="preview(crs.key, idx)"
            @mouseleave="removePreview()"
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
import { Schedule } from '../models/Schedule';
export default {
    props: {
        courses: Array,
        schedule: Schedule,
        isEntering: Boolean
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
            this.$emit('update_course', crs.key, idx);
            this.$forceUpdate();
        },
        collapse(key) {
            this.collapsed[key] === undefined
                ? this.$set(this.collapsed, key, key)
                : this.$set(this.collapsed, key, undefined);
        },
        isActive(key, idx) {
            return this.schedule.All[key] instanceof Set && this.schedule.All[key].has(idx);
        },
        preview(key, idx) {
            this.$emit('preview', key, idx);
        },
        removePreview() {
            this.$emit('remove_preview');
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
