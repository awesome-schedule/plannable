<template>
    <div id="class-list w-100">
        <div class="card-body p-0" tabindex="-1" @keyup.esc="$emit('close')">
            <div
                v-for="crs in courses"
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
                                    v-html="
                                        highlightMatch(
                                            crs.department + ' ' + crs.number + ' ' + crs.type,
                                            'key',
                                            crs.matches
                                        )
                                    "
                                >
                                </span>
                                <span
                                    v-if="emptyCourse(crs)"
                                    class="ml-1 text-warning"
                                    title="No sections are selected! Any Section will be selected implicitly"
                                >
                                    <i class="fas fa-exclamation-triangle"></i>
                                </span>
                                <span
                                    v-if="crs.isFake"
                                    class="ml-1 text-danger"
                                    title="This course does not exist any more! Please delete it"
                                >
                                    <i class="fas fa-exclamation-triangle"></i>
                                </span>
                                <span
                                    v-else-if="crs.hasFakeSections"
                                    class="ml-1 text-danger"
                                    title="You've select some section(s) that do not exist anymore!"
                                >
                                    <i class="fas fa-exclamation-triangle"></i>
                                </span>
                                <!-- <small class="bg-primary float-right">Topic</small> -->
                            </h6>

                            <p
                                v-if="showClasslistTitle || isEntering"
                                style="font-size: 0.85rem; margin: 0;"
                                :class="{ 'text-danger': crs.isFake }"
                                v-html="highlightMatch(crs.title, 'title', crs.matches)"
                            ></p>
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
                                @click="$emit('course_modal', crs)"
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
                        <div
                            v-for="(sec, idx) in crs.sections"
                            :key="idx"
                            :class="{ show: isEntering && expandOnEntering }"
                        >
                            <a
                                v-if="showAny && idx === 0"
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
                            <!-- we want to reduce the number of schedule computations. so we use mouseenter instead of mouseover -->
                            <div
                                class="list-group-item list-group-item-action container-fluid class-section"
                                :class="{
                                    active: isActive(crs.key, sec.sid) && !sec.isFake,
                                    'not-exist': sec.isFake
                                }"
                                :title="
                                    sec.isFake
                                        ? `You've selected a non-existent section! Maybe this section used to exist, but not it has been removed!`
                                        : isActive(crs.key, sec.sid)
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
                                                    v-html="
                                                        highlightMatch(
                                                            sec.topic,
                                                            'topic',
                                                            sec.matches
                                                        )
                                                    "
                                                ></span>
                                            </li>
                                            <template v-for="(meeting, j) in sec.meetings">
                                                <li :key="j">
                                                    {{ meeting.days }}
                                                </li>
                                            </template>
                                            <li
                                                v-html="
                                                    highlightMatch(
                                                        sec.instructors.join(', '),
                                                        'instructors',
                                                        sec.matches
                                                    )
                                                "
                                            ></li>
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

.not-exist {
    background: red !important;
    color: white;
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
