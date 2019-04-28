<template>
    <div id="class-list w-100">
        <div class="card-body p-0" tabindex="-1" @keyup.esc="$emit('close')">
            <div v-for="crs in courses" :key="crs.key" class="list-group list-group-flush">
                <div class="list-group-item class-title py-1 px-0">
                    <table class="w-100">
                        <tr>
                            <td class="expand-icon pr-2">
                                <i class="fas" :class="expanded(crs.key)"></i>
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
                            <td v-if="!isEntering" class="pl-2 pr-1">
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
                            :class="{ show: isEntering && expandOnEntering }"
                        >
                            <a
                                v-if="!generated && idx === 0"
                                style="font-size: 1rem; padding: 0.5rem 0 0.5rem 1rem"
                                class="list-group-item list-group-item-action class-section"
                                :class="{ active: schedule.All[crs.key] === -1 }"
                                :title="
                                    schedule.All[crs.key] === -1
                                        ? 'click to unselect'
                                        : 'click to select'
                                "
                                @click="select(crs.key, -1)"
                            >
                                <div class="row no-gutters justify-content-between">
                                    <div class="col-md-auto">Any Section</div>
                                    <div class="col col-sm-1 align-self-center">
                                        <i
                                            v-if="schedule.All[crs.key] === -1"
                                            class="far fa-check-square"
                                        ></i>
                                        <i v-else class="far fa-square"></i>
                                    </div>
                                </div>
                            </a>
                            <div
                                class="list-group-item list-group-item-action container-fluid class-section"
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
                                <div class="row no-gutters justify-content-between">
                                    <div class="col-md-auto">
                                        <ul
                                            class="list-unstyled class-info"
                                            style="font-size: 0.75rem;"
                                        >
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
                                    <div class="col col-sm-1 align-self-center">
                                        <i
                                            v-if="isActive(crs.key, crs.sids[idx])"
                                            class="far fa-check-square"
                                        ></i>
                                        <i v-else class="far fa-square"></i>
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

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator';
import Schedule from '../models/Schedule';
import Expand from './Expand.vue';
import Course from '../models/Course';

@Component({
    components: {
        Expand
    }
})
export default class ClassList extends Vue {
    @Prop(Array) readonly courses!: Course[];
    @Prop(Schedule) readonly schedule!: Schedule;
    @Prop({ default: false, type: Boolean }) readonly isEntering!: boolean;
    @Prop(Boolean) readonly generated!: boolean;
    @Prop(Boolean) readonly showClasslistTitle!: boolean;

    collapsed: { [x: string]: string } = {};
    expandOnEntering = false;

    select(key: string, idx: number) {
        this.$emit('update_course', key, idx, this.isEntering);
    }

    collapse(key: string) {
        if (this.collapsed[key]) {
            this.$set(this.collapsed, key, undefined);
        } else {
            this.$set(this.collapsed, key, key);
        }
    }
    isActive(key: string, idx: number) {
        const sections = this.schedule.All[key];
        if (sections instanceof Set) return sections.has(idx);
        return false;
    }
    expanded(key: string) {
        return (this.collapsed[key] !== undefined) !== (this.isEntering && this.expandOnEntering)
            ? 'fa-chevron-down'
            : 'fa-chevron-right';
    }
    preview(key: string, idx: number) {
        this.schedule.preview(key, idx);
    }
    removePreview() {
        this.schedule.removePreview();
    }
}
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
