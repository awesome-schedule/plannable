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
                                    <i class="fas" :class="expanded(crs.key)"></i>
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
                </div>
                <Expand>
                    <div
                        v-if="expanded(crs.key) === 'fa-chevron-down'"
                        :id="`${crs.key}trans`"
                        class="trans"
                    >
                        <div
                            v-for="(sec, idx) in crs.sections"
                            :key="idx"
                            class="list-group"
                            :class="{ show: isEntering && expandOnEntering }"
                        >
                            <a
                                v-if="!generated && idx === 0"
                                style="font-size: 1rem; padding: 0.5rem 0.5rem 0.5rem 1rem"
                                class="list-group-item list-group-item-action class-section"
                                :class="{ active: schedule.All[crs.key] === -1 }"
                                :title="
                                    schedule.All[crs.key] === -1
                                        ? 'click to unselect'
                                        : 'click to select'
                                "
                                @click="select(crs.key, -1)"
                                >Any Section
                                <div v-if="schedule.All[crs.key] === -1" style="float:right;">
                                    <i class="fas fa-check"></i>
                                </div>
                            </a>
                            <div
                                class="list-group-item list-group-item-action class-section container-fluid"
                                :class="{ active: isActive(crs.key, crs.sids[idx]) }"
                                :title="
                                    isActive(crs.key, crs.sids[idx])
                                        ? 'click to unselect'
                                        : 'click to select'
                                "
                                @click="select(crs.key, crs.sids[idx])"
                                @mouseover="preview(crs.key, crs.sids[idx])"
                                @mouseleave="removePreview()"
                            >
                                <div class="row no-gutters">
                                    <div class="col-md-auto mr-auto">
                                        <ul class="list-unstyled class-info">
                                            <li>Section {{ sec.section }} {{ sec.topic }}</li>
                                            <template v-for="(meeting, j) in sec.meetings">
                                                <li :key="j">
                                                    {{ meeting.days }}
                                                </li>
                                            </template>
                                            <li>
                                                {{ sec.instructors.join(', ') }}
                                            </li>
                                        </ul>
                                    </div>
                                    <div class="col col-sm-1 align-self-center mr-1">
                                        <i
                                            v-if="isActive(crs.key, crs.sids[idx])"
                                            style="font-size: 0.85rem"
                                            class="fas fa-check"
                                        ></i>
                                    </div>
                                </div>
                            </div>
                        </div></div
                ></Expand>
            </div>
        </div>
    </div>
</template>

<script>
import Vue from 'vue';
import Schedule from '../models/Schedule';
import Expand from './Expand.vue';
export default Vue.extend({
    name: 'ClassList',
    components: {
        Expand
    },
    props: {
        /**
         * @type {import('../models/Course').default[]}
         */
        courses: Array,
        schedule: Schedule,
        isEntering: Boolean,
        showClasslistTitle: Boolean,
        generated: Boolean
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
         * @param {string} key
         * @param {number} idx
         */
        select(key, idx) {
            this.$emit('update_course', key, idx);
            // note: adding a course to schedule.All cannot be detected by Vue.
            // Must use forceUpdate to rerender component
            this.$forceUpdate();
        },
        /**
         * @param {string}
         */
        collapse(key) {
            if (this.collapsed[key]) {
                const ele = document.getElementById(`${key}trans`);
                ele.style.maxHeight = ele.clientHeight + 'px';
                this.$set(this.collapsed, key, undefined);
            } else {
                this.$set(this.collapsed, key, key);
            }
        },
        /**
         * @param {string} key
         * @param {number} idx
         * @returns {boolean}
         */
        isActive(key, idx) {
            const sections = this.schedule.All[key];
            if (sections instanceof Set) return this.schedule.All[key].has(idx);
            return false;
        },
        /**
         * @param {string} key
         * @returns {string}
         */
        expanded(key) {
            return (this.collapsed[key] !== undefined) !==
                (this.isEntering && this.expandOnEntering)
                ? 'fa-chevron-down'
                : 'fa-chevron-right';
        },
        /**
         * @param {string} key
         * @param {number} idx
         */
        preview(key, idx) {
            this.schedule.preview(key, idx);
        },
        removePreview() {
            this.schedule.removePreview();
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
