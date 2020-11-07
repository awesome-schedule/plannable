<template>
    <nav class="bg-light sidebar">
        <div class="dropdown">
            <button id="semester" class="btn btn-info nav-btn mt-0" data-toggle="dropdown">
                <i
                    v-if="semester.pendingPromise"
                    class="fa fa-times click-icon mr-2"
                    style="font-size: 16px"
                    title="Cancel loading"
                    @click="semester.cancel()"
                ></i>
                <span
                    v-if="status.loading || semester.pendingPromise"
                    class="spinner-border mr-1"
                    style="width: 1.2em; height: 1.2em; margin-bottom: 0.1em"
                >
                </span>
                {{ semester.currentSemester ? semester.currentSemester.name : 'Select Semester' }}
                <i class="fas fa-caret-down ml-2" style="font-size: 20px;"></i>
            </button>
            <div v-if="semester.semesters.length" class="dropdown-menu w-100">
                <a
                    v-for="sem in semester.semesters"
                    :key="sem.id"
                    class="dropdown-item w-100"
                    @click="selectSemester(sem)"
                    >{{ sem.name }}
                </a>
            </div>
        </div>
        <div
            class="input-group mt-2"
            @keydown.enter="dSelect(dPointer)"
            @keydown.down="dropdownNext()"
            @keydown.up="dropdownPrev()"
        >
            <input
                ref="classSearch"
                v-model="query"
                type="text"
                class="form-control form-control-sm"
                placeholder="Title/Number/Topic/Prof./Desc."
                @keyup.esc="closeClassList()"
            />
            <div v-if="query === ':'" class="dropdown-menu show">
                <a
                    v-for="(q, id) of queryTypes"
                    :key="q"
                    :class="`dropdown-item ${id === dPointer ? 'active' : ''}`"
                    @click="dSelect(id)"
                    @keydown.enter="dSelect(id)"
                    >{{ q }}</a
                >
            </div>
            <div class="input-group-append">
                <span
                    class="input-group-text px-2"
                    :class="{ 'click-icon': isEntering }"
                    @click="closeClassList"
                    ><i v-if="isEntering" class="fas fa-times"> </i>
                    <i v-else class="fas fa-search"></i>
                </span>
            </div>
        </div>

        <ClassList
            v-if="isEntering"
            ref="enteringClassList"
            :courses="inputCourses"
            :matches="inputMatches"
            :schedule="schedule.currentSchedule"
            :is-entering="isEntering"
            :show-classlist-title="display.showClasslistTitle"
            :expand-on-entering="display.expandOnEntering"
            @update-course="updateCourse"
            @course-modal="modal.showCourseModal($event.crs, $event.match)"
            @close="closeClassList()"
        ></ClassList>
        <button
            class="btn btn-info nav-btn mt-2"
            :title="
                schedule.generated
                    ? 'Click to edit your schedule'
                    : 'Click to view generated schedules'
            "
            @click="schedule.switchSchedule(!schedule.generated)"
        >
            {{
                schedule.generated
                    ? `View Schedule: ${schedule.currentScheduleIndex + 1}`
                    : 'Edit Classes'
            }}
            <i class="fas fa-exchange-alt ml-4" style="font-size: 18px;"></i>
        </button>
        <div
            class="row no-gutters mx-3 align-items-center justify-content-between"
            style="font-size: 24px"
        >
            <div class="col-auto">
                <i
                    class="fas fa-long-arrow-alt-left"
                    title="previous schedule"
                    :class="schedule.proposedScheduleIndex > 0 ? 'click-icon' : 'icon-disabled'"
                    @click="schedule.switchProposed(schedule.proposedScheduleIndex - 1)"
                ></i>
            </div>
            <div
                class="col-auto"
                style="font-size: 20px;"
                title="the index of the current schedule"
            >
                {{ schedule.proposedScheduleIndex + 1 }}
            </div>
            <div class="col-auto">
                <i
                    class="fas fa-long-arrow-alt-right"
                    title="next schedule"
                    :class="
                        schedule.proposedScheduleIndex < schedule.proposedSchedules.length - 1
                            ? 'click-icon'
                            : 'icon-disabled'
                    "
                    @click="schedule.switchProposed(schedule.proposedScheduleIndex + 1)"
                ></i>
            </div>
            <div class="col-auto">
                <i
                    class="far fa-calendar-plus click-icon"
                    title="new schedule"
                    @click="schedule.newProposed()"
                ></i>
            </div>
            <div class="col-auto">
                <i
                    class="far fa-copy click-icon"
                    title="copy the current schedule to a new schedule"
                    @click="schedule.copyCurrent()"
                >
                </i>
            </div>
            <div class="col-auto">
                <i
                    class="far fa-calendar-times"
                    :class="schedule.proposedSchedules.length > 1 ? 'click-icon' : 'icon-disabled'"
                    title="delete current schedule"
                    @click="schedule.deleteProposed()"
                ></i>
            </div>
        </div>
        <ClassList
            ref="selectedClassList"
            :courses="current.courses"
            :schedule="schedule.currentSchedule"
            :show-any="!schedule.generated"
            :show-classlist-title="display.showClasslistTitle"
            @update-course="updateCourse"
            @remove-course="removeCourse"
            @course-modal="modal.showCourseModal($event.crs, $event.match)"
        ></ClassList>
        <div class="btn-group mt-3 w-100">
            <button type="button" class="btn btn-outline-info" @click="generateSchedules()">
                Generate
            </button>
            <button
                class="btn btn-outline-info"
                title="Remove all classes from the current schedule"
                @click="schedule.clear()"
            >
                Clean
            </button>
        </div>
        <div
            title="render all selected sections (except for 'any section')"
            class="custom-control custom-checkbox mt-2 mx-2"
        >
            <input
                id="multiSelect"
                v-model="display.multiSelect"
                type="checkbox"
                class="custom-control-input"
            />
            <label class="custom-control-label" for="multiSelect">
                Show Multiple Sections
            </label>
        </div>
        <div class="btn bg-info nav-btn mt-2">
            Schedule Overview
        </div>
        <ul class="list-group list-group-flush" style="width:99%">
            <li class="list-group-item p-2">
                Total Credits: {{ schedule.currentSchedule.totalCredit }}
                <span
                    v-if="schedule.currentSchedule.totalCredit > 21"
                    class="ml-2"
                    style="font-size: 1.2rem"
                    title="JUST DO IT"
                >
                    😮
                </span>
            </li>
            <table class="ml-2 mr-0 mt-2 mb-2">
                <tr v-for="idx in current.ids.length" :key="idx">
                    <td>{{ current.courses[idx - 1].displayName }}</td>
                    <td>
                        <select class="custom-select custom-select-sm py-0">
                            <option v-for="id in current.ids[idx - 1]" :key="id">{{ id }}</option>
                        </select>
                    </td>
                </tr>
            </table>
        </ul>
    </nav>
</template>

<script lang="ts" src="./ClassView.ts"></script>
