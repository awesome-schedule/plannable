<template>
    <div id="class-list" class="card" style="width: 100%">
        <div class="card-body" style="padding: 0.25rem; max-height: 560px; overflow-y: auto">
            <div v-for="crs in courses" :key="crs.key" class="list-group list-group-flush">
                <!-- data-toggle="popover"
          data-html="true"
          data-placement="right"
          v-bind:data-content="crs.description"
        v-bind:data-title="crs.title"-->
                <div class="list-group-item list-group-item-action class-title">
                    <table style="width: 100%">
                        <tr>
                            <td
                                style="padding-right: 0.5rem"
                                data-toggle="collapse"
                                :data-target="`#${crs.key}`"
                                @click="collapse(crs.key)"
                            >
                                <i class="fas" :class="expanded(crs)"></i>
                            </td>
                            <td>
                                <h6 style="margin-bottom: 0.25rem">
                                    {{ crs.department }} {{ crs.number }} {{ crs.type }}
                                    <i
                                        data-toggle="modal"
                                        data-target="#class-list-modal"
                                        class="fas fa-info-circle"
                                        @click="$emit('trigger-classlist-modal', crs)"
                                    ></i>
                                </h6>
                                <p style="font-size: 0.85rem; margin: 0">{{ crs.title }}</p>
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
                    v-for="(sec, idx) in crs.section"
                    :id="crs.key"
                    :key="sec"
                    class="list-group collapse multi-collapse"
                    :class="{ show: isEntering }"
                >
                    <a
                        v-if="idx === 0"
                        style="font-size: 1rem; padding: 0.5rem 1rem"
                        class="list-group-item list-group-item-action class-section"
                        :class="{ active: schedule.All[crs.key] === -1 }"
                        @click="select(crs, -1)"
                        >Any Section</a
                    >
                    <div
                        class="list-group-item list-group-item-action class-section"
                        :class="{ active: isActive(crs.key, idx) }"
                        @click="select(crs, idx)"
                        @mouseover="preview(crs.key, idx)"
                        @mouseleave="removePreview()"
                    >
                        <ul class="list-unstyled class-info">
                            <li>{{ sec }} {{ crs.days[idx] }}</li>
                            <li>{{ crs.topic[idx] }}</li>
                            <li>{{ crs.instructor[idx].join(', ') }} {{ crs.room[idx] }}</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
// eslint-disable-next-line
import CourseRecord from '../models/CourseRecord';
import Schedule from '../models/Schedule';
export default {
    props: {
        courses: Array,
        schedule: Schedule,
        isEntering: Boolean
    },
    data() {
        return {
            collapsed: {}
        };
    },
    methods: {
        select(crs, idx) {
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
        expanded(crs) {
            return (this.collapsed[crs.key] !== undefined) ^ this.isEntering
                ? 'fa-chevron-down'
                : 'fa-chevron-right';
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
