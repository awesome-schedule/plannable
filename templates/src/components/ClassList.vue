<template>
    <div id="class-list" style="width: 100%">
        <div class="card-body p-0">
            <div v-for="crs in courses" :key="crs.key" class="list-group list-group-flush">
                <div class="list-group-item class-title py-1 px-0">
                    <table style="width: 100%">
                        <tr>
                            <td class="expand-icon pr-2">
                                <button
                                    type="button"
                                    class="close"
                                    style="font-size:1.2rem"
                                    @click="collapse(crs.key)"
                                >
                                    <i class="fas" :class="expanded(crs)"></i>
                                </button>
                            </td>
                            <td>
                                <h6 class="mb-1">
                                    <span style="cursor: pointer" @click="collapse(crs.key)"
                                        >{{ crs.department }} {{ crs.number }} {{ crs.type }}
                                    </span>
                                    <span class="ml-1" style="font-size:0.8rem">
                                        <i
                                            data-toggle="modal"
                                            data-target="#class-list-modal"
                                            class="fas fa-info-circle"
                                            title="View class description"
                                            style="cursor: pointer"
                                            @click="$emit('trigger-classlist-modal', crs)"
                                        ></i>
                                    </span>
                                </h6>

                                <p
                                    v-if="showClasslistTitle || isEntering"
                                    style="font-size: 0.85rem; margin: 0; cursor: pointer"
                                    @click="collapse(crs.key)"
                                >
                                    {{ crs.title }}
                                </p>
                            </td>
                            <td v-if="!isEntering" class="pl-2">
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

                    <!-- <div class="container-fluid" style="padding: 0">
                        <div
                            class="row justify-content-md-center no-gutters"
                            style="flex-wrap: nowrap"
                        >
                            <div
                                class="col col-xs-1 expand-icon pr-1"
                                data-toggle="collapse"
                                :data-target="`#${crs.key}`"
                                @click="collapse(crs.key)"
                            >
                                <i class="fas" :class="expanded(crs)"></i>
                            </div>
                            <div class="col-xs-10">
                                <h6 class="mb-1">
                                    {{ crs.department }} {{ crs.number }} {{ crs.type }}
                                    <i
                                        data-toggle="modal"
                                        data-target="#class-list-modal"
                                        class="fas fa-info-circle"
                                        title="View class description"
                                        @click="$emit('trigger-classlist-modal', crs)"
                                    ></i>
                                </h6>
                                <p style="font-size: 0.85rem; margin: 0">{{ crs.title }}</p>
                            </div>
                            <div class="col col-xs-1 pl-1">
                                <button
                                    v-if="!isEntering"
                                    type="button"
                                    class="close"
                                    aria-label="Close"
                                    @click="$emit('remove_course', crs.key)"
                                >
                                    <span aria-hidden="true">&times;</span>
                                </button>
                            </div>
                        </div>
                    </div> -->
                </div>
                <Expand>
                    <div
                        v-if="expanded(crs) === 'fa-chevron-down'"
                        :id="`${crs.key}trans`"
                        class="trans"
                    >
                        <div
                            v-for="(sec, idx) in crs.section"
                            :key="sec + idx"
                            class="list-group"
                            :class="{ show: isEntering && expandOnEntering }"
                        >
                            <a
                                v-if="idx === 0"
                                style="font-size: 1rem; padding: 0.5rem 0.5rem 0.5rem 1rem"
                                class="list-group-item list-group-item-action class-section"
                                :class="{ active: schedule.All[crs.key] === -1 }"
                                :title="
                                    schedule.All[crs.key] === -1
                                        ? 'click to unselect'
                                        : 'click to select'
                                "
                                @click="select(crs, -1)"
                                >Any Section
                                <div v-if="schedule.All[crs.key] === -1" style="float:right;">
                                    <i class="fas fa-check"></i>
                                </div>
                            </a>

                            <div
                                class="list-group-item list-group-item-action class-section container-fluid"
                                :class="{ active: isActive(crs.key, idx) }"
                                :title="
                                    isActive(crs.key, idx) ? 'click to unselect' : 'click to select'
                                "
                                @click="select(crs, idx)"
                                @mouseover="preview(crs.key, idx)"
                                @mouseleave="removePreview()"
                            >
                                <div class="row no-gutters">
                                    <div class="col-md-auto mr-auto">
                                        <ul class="list-unstyled class-info">
                                            <li>{{ sec }} {{ crs.days[idx] }}</li>
                                            <li>{{ crs.topic[idx] }}</li>
                                            <li>
                                                {{ crs.instructor[idx].join(', ') }}
                                                <!-- {{ crs.room[idx] }} -->
                                            </li>
                                        </ul>
                                    </div>
                                    <div class="col col-sm-1 align-self-center mr-1">
                                        <i
                                            v-if="isActive(crs.key, idx)"
                                            style="font-size: 0.85rem"
                                            class="fas fa-check"
                                        ></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </Expand>
            </div>
        </div>
    </div>
</template>

<script>
import Vue from 'vue';
// eslint-disable-next-line
import CourseRecord from '../models/CourseRecord.js';
import Schedule from '../models/Schedule.js';
import Expand from './Expand.vue';
export default Vue.extend({
    name: 'ClassList',
    components: {
        Expand
    },
    props: {
        /**
         * @type {CourseRecord[]}
         */
        courses: Array,
        schedule: Schedule,
        isEntering: Boolean,
        showClasslistTitle: Boolean
    },
    data() {
        return {
            /**
             * @type {Object<string, string>}
             */
            collapsed: {},
            expandOnEntering: false
            // showClassTitleOnEntering: true
        };
    },
    methods: {
        /**
         * @param {CourseRecord} crs
         * @param {number} idx
         */
        select(crs, idx) {
            this.$emit('update_course', crs.key, idx);
            // note: adding a course to schedule.All cannot be detected by Vue. Must use forceUpdate to rerender component
            this.$forceUpdate();
        },
        /**
         * @param {string}
         */
        collapse(key) {
            if (this.collapsed[key] === undefined) {
                this.$set(this.collapsed, key, key);
            } else {
                const ele = document.getElementById(`${key}trans`);
                ele.style.maxHeight = ele.clientHeight + 'px';
                this.$set(this.collapsed, key, undefined);
            }
        },
        /**
         * @param {string} key
         * @param {number} idx
         * @returns {boolean}
         */
        isActive(key, idx) {
            return this.schedule.All[key] instanceof Set && this.schedule.All[key].has(idx);
        },
        /**
         * @param {CourseRecord}
         * @returns {string}
         */
        expanded(crs) {
            return (this.collapsed[crs.key] !== undefined) ^
                (this.isEntering && this.expandOnEntering)
                ? 'fa-chevron-down'
                : 'fa-chevron-right';
        },
        /**
         * @param {string} key
         * @param {number} idx
         */
        preview(key, idx) {
            this.$emit('preview', key, idx);
        },
        removePreview() {
            this.$emit('remove_preview');
        }
    }
});
</script>

<style scoped>
.trans {
    overflow: hidden;
}
.subtitle {
    font-size: 0.7rem;
    margin-top: 0;
    margin-bottom: 0;
}

.active {
    color: white !important;
}

.class-title {
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

.expand-icon {
    width: 10%;
}
</style>
