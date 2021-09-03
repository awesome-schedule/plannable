<template>
    <div class="card-body p-1 w-100" tabindex="-1" @keyup.esc="$emit('close')">
        <!-- we want to reduce the number of schedule computations. so we use mouseenter instead of mouseover -->
        <div v-for="(crs, idx) in courses" :key="crs.key" class="list-group list-group-flush w-100">
            <div
                class="list-group-item py-1 px-0 w-100"
                @mouseenter="schedule.hover(crs.key)"
                @mouseleave="schedule.unhover(crs.key)"
            >
                <div
                    class="row flex-nowrap no-gutters justify-content-between"
                    style="cursor: pointer"
                    @click="collapse(crs.key)"
                >
                    <div class="col col-1 pl-1 align-self-center">
                        <i
                            class="fas click-icon"
                            :class="expanded(crs.key) ? 'fa-chevron-down' : 'fa-chevron-right'"
                        ></i>
                    </div>
                    <!-- push the last column to the right by mr-auto -->
                    <div class="col-xs-auto mr-auto align-self-center my-0">
                        <h6 class="mb-1">
                            <span
                                v-if="matches.length"
                                v-html="highlightMatch(crs.displayName, 'key', matches[idx][0])"
                            >
                            </span>
                            <span v-else>{{ crs.displayName }}</span>
                            <span
                                v-if="schedule.isCourseEmpty(crs.key)"
                                class="ml-1 text-danger"
                                title="No sections are selected! You won't be able to generate schedules. If you want to remove this course, click x"
                            >
                                <i class="fas fa-exclamation-triangle"></i>
                            </span>
                            <span
                                v-if="schedule.isSomeTBD(crs.key)"
                                class="ml-1 text-warning"
                                title="All sections selected have invalid (e.g. TBA/TBD) meeting time. They will not appear on the schedule."
                            >
                                <i class="fas fa-exclamation-triangle"></i>
                            </span>
                        </h6>
                        <template v-if="showClasslistTitle || isEntering">
                            <p
                                v-if="matches.length"
                                style="font-size: 0.85rem; margin: 0;"
                                v-html="highlightMatch(crs.title, 'title', matches[idx][0])"
                            ></p>
                            <p v-else style="font-size: 0.85rem; margin: 0;">
                                {{ crs.title }}
                            </p>
                        </template>
                    </div>
                    <div
                        class="col align-self-center"
                        :class="{
                            'text-center': showClasslistTitle,
                            'text-right': !showClasslistTitle,
                            'col-1': showClasslistTitle,
                            'col-xs-auto': !showClasslistTitle
                        }"
                    >
                        <i
                            class="fas fa-info-circle click-icon"
                            :class="{ 'pr-2': !showClasslistTitle }"
                            title="View class description"
                            @click.stop="$emit('course-modal', { crs, match: matches[idx] })"
                        ></i>
                        <br v-if="showClasslistTitle" />
                        <i
                            v-if="!isEntering"
                            class="fas fa-times click-icon"
                            :class="{ 'pr-1': !showClasslistTitle }"
                            title="Remove this class and all its sections from your schedule"
                            @click.stop="$emit('remove-course', crs.key)"
                        ></i>
                    </div>
                </div>
            </div>
            <Expand>
                <div v-if="expanded(crs.key)" class="trans">
                    <!-- no "Any Section" for engagement due to some strange requests -->
                    <div
                        v-if="showAny"
                        class="row no-gutters flex-nowrap justify-content-between"
                        style="font-size: 0.90rem"
                    >
                        <div
                            class="col col-7"
                            style="border-right: thin solid #eeeeee;"
                            @click="select(crs.key, -1)"
                        >
                            <div
                                class="list-group-item list-group-item-action px-3"
                                :class="{ active: schedule.isAnySection(crs.key) }"
                            >
                                <div class="row no-gutters flex-nowrap justify-content-between">
                                    <div class="col-xs-auto mr-auto">Any Section</div>
                                    <div class="col-xs-auto align-self-center">
                                        <i
                                            v-if="schedule.isAnySection(crs.key)"
                                            class="far fa-check-square"
                                        ></i>
                                        <i v-else class="far fa-square"></i>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div
                            class="col col-5"
                            @click="
                                schedule.ungroup(crs.key);
                                updateGroup(crs.key);
                            "
                        >
                            <div
                                class="list-group-item list-group-item-action pl-2 pr-3"
                                :class="{ active: schedule.isGroup(crs.key) || group[crs.key] }"
                                title="Group selection mode: new feature of plannable v8.x. See Information for details."
                            >
                                <div class="row no-gutters flex-nowrap justify-content-between">
                                    <div class="col-xs-auto mr-auto">Groups</div>
                                    <div class="col-xs-auto align-self-center">
                                        <i
                                            v-if="schedule.isGroup(crs.key) || group[crs.key]"
                                            class="far fa-check-square"
                                        ></i>
                                        <i v-else class="far fa-square"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <template v-for="(value, key) in separatedCourses[crs.key]">
                        <li
                            v-if="Object.keys(separatedCourses[crs.key]).length > 1"
                            :key="key"
                            class="list-group-item list-group-item-action py-2 pl-3 pr-0"
                            title="click to select all sections in this time period"
                            @click="selectAll(value.key, value)"
                        >
                            <div class="row no-gutters justify-content-between">
                                <div class="col-md-auto">
                                    <strong>{{ key }}</strong>
                                </div>
                                <div class="col col-sm-1 align-self-center">
                                    <i
                                        v-if="allTimeSelected(crs.key, key)"
                                        class="far fa-check-square"
                                    ></i>
                                    <i v-else class="far fa-square"></i>
                                </div>
                            </div>
                        </li>
                        <div
                            v-for="sec in value.sections"
                            :key="sec.id"
                            class="list-group-item list-group-item-action class-section"
                            :class="{
                                active: schedule.hasSection(crs.key, sec.id)
                            }"
                            :title="
                                schedule.hasSection(crs.key, sec.id)
                                    ? 'click to unselect'
                                    : 'click to select'
                            "
                            @mouseenter="schedule.preview(sec)"
                            @mouseleave="schedule.removePreview()"
                            @click="select(crs.key, sec.id)"
                        >
                            <div class="row no-gutters flex-nowrap justify-content-between">
                                <div class="col col-8 mr-auto">
                                    <ul class="list-unstyled m-0" style="font-size: 0.75rem;">
                                        <li>
                                            Section {{ sec.section }}
                                            <i
                                                v-if="sec.valid"
                                                :title="sec.validMsg[1]"
                                                class="fas fa-exclamation-triangle"
                                                :class="sec.validMsg[0]"
                                            ></i>
                                        </li>
                                        <li>
                                            <span
                                                v-if="matches.length"
                                                v-html="
                                                    highlightMatch(
                                                        sec.topic,
                                                        'topic',
                                                        matches[idx][1].get(sec.id)
                                                    )
                                                "
                                            ></span>
                                            <span v-else> {{ sec.topic }}</span>
                                        </li>
                                        <li v-for="(meeting, i) in sec.meetings" :key="i">
                                            {{ meeting.days }}
                                        </li>
                                        <li
                                            v-if="matches.length"
                                            v-html="
                                                highlightMatch(
                                                    sec.instructors,
                                                    'instructors',
                                                    matches[idx][1].get(sec.id)
                                                )
                                            "
                                        ></li>
                                        <li v-else>{{ sec.instructors }}</li>
                                        <li
                                            v-if="matches.length"
                                            v-html="
                                                highlightMatch(
                                                    sec.rooms,
                                                    'rooms',
                                                    matches[idx][1].get(sec.id)
                                                )
                                            "
                                        ></li>
                                        <li v-else>{{ sec.rooms }}</li>
                                    </ul>
                                </div>
                                <div class="col col-sm-auto align-self-center">
                                    <!-- only shown if in group mode -->
                                    <input
                                        v-show="schedule.isGroup(crs.key) || group[crs.key]"
                                        :id="crs.key + '-' + sec.id"
                                        type="number"
                                        class="form-control form-control-sm"
                                        style="width: 45px"
                                        :disabled="!schedule.hasSection(crs.key, sec.id)"
                                        :value="schedule.getSectionGroup(crs.key, sec.id)"
                                        min="0"
                                        max="8"
                                        @change="select(crs.key, sec.id)"
                                        @click.stop=""
                                    />
                                </div>
                                <div class="col col-1 ml-3 mr-2 align-self-center">
                                    <i
                                        v-if="schedule.hasSection(crs.key, sec.id)"
                                        class="far fa-check-square"
                                    ></i>
                                    <i v-else class="far fa-square"></i>
                                </div>
                            </div>
                        </div>
                    </template>
                </div>
            </Expand>
        </div>
    </div>
</template>

<script lang="ts" src="./ClassList.ts"></script>

<style scoped>
.click-icon {
    color: #555555;
}

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

.class-section {
    padding: 0.1rem 0 0.1rem 1rem;
    margin: 0;
}
</style>
