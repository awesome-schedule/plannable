<template>
    <div id="class-list w-100">
        <div class="card-body p-0" tabindex="-1" @keyup.esc="$emit('close')">
            <!-- we want to reduce the number of schedule computations. so we use mouseenter instead of mouseover -->
            <div
                v-for="(crs, idx) in courses"
                :key="crs.key"
                class="list-group list-group-flush w-100"
                @mouseenter="schedule.hover(crs.key)"
                @mouseleave="schedule.unhover(crs.key)"
            >
                <div class="list-group-item class-title py-1 px-0 w-100">
                    <div class="row flex-nowrap no-gutters justify-content-between">
                        <div class="col col-1 pl-1 align-self-center" @click="collapse(crs.key)">
                            <i
                                class="fas click-icon"
                                :class="expanded(crs.key) ? 'fa-chevron-down' : 'fa-chevron-right'"
                            ></i>
                        </div>
                        <!-- push the last column to the right by mr-auto -->
                        <div
                            class="col-xs-auto mr-auto align-self-center my-0"
                            style="cursor: pointer"
                            @click="collapse(crs.key)"
                        >
                            <h6 class="mb-1">
                                <span
                                    v-if="matches.length"
                                    v-html="highlightMatch(crs.displayName, 'key', matches[idx][0])"
                                >
                                </span>
                                <span v-else>{{ crs.displayName }}</span>
                                <span
                                    v-if="emptyCourse(crs)"
                                    class="ml-1 text-warning"
                                    title="No sections are selected! Any Section will be selected implicitly"
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
                                @click="$emit('course_modal', { crs, match: matches[idx] })"
                            ></i>
                            <br v-if="showClasslistTitle" />
                            <i
                                v-if="!isEntering"
                                class="fas fa-times click-icon"
                                :class="{ 'pr-1': !showClasslistTitle }"
                                title="Remove this class and all its sections from your schedule"
                                @click="$emit('remove_course', crs.key)"
                            ></i>
                        </div>
                    </div>
                </div>
                <Expand>
                    <div v-if="expanded(crs.key)" :id="`${crs.key}trans`" class="trans">
                        <!-- no "Any Section" for engagement due to some strange requests -->
                        <a
                            v-if="showAny && crs.department !== 'EGMT'"
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
                        <div v-for="(value, key) in separatedCourses[crs.key]" :key="key">
                            <ul
                                v-if="Object.keys(separatedCourses[crs.key]).length > 1"
                                class="list-group class-info"
                            >
                                <li
                                    class="list-group-item list-group-item-action class-section py-2"
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
                            </ul>
                            <div
                                v-for="sec in value.sections"
                                :key="sec.sid"
                                :class="{ show: isEntering && expandOnEntering }"
                            >
                                <div
                                    class="list-group-item list-group-item-action container-fluid class-section"
                                    :class="{
                                        active: isActive(crs.key, sec.sid)
                                    }"
                                    :title="
                                        isActive(crs.key, sec.sid)
                                            ? 'click to unselect'
                                            : 'click to select'
                                    "
                                    @click="select(crs.key, sec.sid)"
                                    @mouseenter="schedule.preview(sec)"
                                    @mouseleave="schedule.removePreview()"
                                >
                                    <div class="row no-gutters justify-content-between">
                                        <div class="col-md-auto">
                                            <ul
                                                class="list-unstyled class-info"
                                                style="font-size: 0.75rem;"
                                            >
                                                <li>
                                                    Section {{ sec.section }}
                                                    <span
                                                        v-if="matches.length"
                                                        v-html="
                                                            highlightMatch(
                                                                sec.topic,
                                                                'topic',
                                                                matches[idx][1].get(sec.sid)
                                                            )
                                                        "
                                                    ></span>
                                                    <span v-else> {{ sec.topic }}</span>
                                                    <!-- 14 = 0b1110, i.e. validity > 1 -->
                                                    <i
                                                        v-if="sec.valid"
                                                        :title="sec.validMsg"
                                                        class="fas fa-exclamation-triangle"
                                                        :class="
                                                            sec.valid & 14
                                                                ? `text-danger`
                                                                : `text-warning`
                                                        "
                                                    ></i>
                                                </li>
                                                <li
                                                    v-for="meeting in sec.meetings"
                                                    :key="meeting.days"
                                                >
                                                    {{ meeting.days }}
                                                </li>
                                                <li
                                                    v-if="matches.length"
                                                    v-html="
                                                        highlightMatch(
                                                            sec.instructors.join(', '),
                                                            'instructors',
                                                            matches[idx][1].get(sec.sid)
                                                        )
                                                    "
                                                ></li>
                                                <li v-else>{{ sec.instructors.join(', ') }}</li>
                                            </ul>
                                        </div>
                                        <div class="col col-sm-1 align-self-center">
                                            <i
                                                v-if="isActive(crs.key, sec.sid)"
                                                class="far fa-check-square"
                                            ></i>
                                            <i v-else class="far fa-square"></i>
                                        </div>
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
