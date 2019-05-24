<template>
    <nav class="bg-light sidebar-nocol">
        <div class="dropdown">
            <button id="semester" class="btn btn-info nav-btn mt-0" data-toggle="dropdown">
                <span v-if="status.loading" class="spinner-border spinner-border-sm"></span>
                {{ semester.currentSemester ? semester.currentSemester.name : 'Select Semester' }}
                <i class="fas fa-caret-down ml-4" style="font-size: 20px;"></i>
            </button>
            <div v-if="semester.semesters.length" class="dropdown-menu w-100">
                <a
                    v-for="sem in semester.semesters"
                    :key="sem.id"
                    class="dropdown-item w-100"
                    href="#"
                    @click="selectSemester(sem)"
                    >{{ sem.name }}
                </a>
            </div>
        </div>
        <div class="input-group mt-2">
            <input
                ref="classSearch"
                type="text"
                class="form-control form-control-sm"
                placeholder="Title/Number/Topic/Prof./Desc."
                @input="getClass($event.target.value)"
                @keyup.esc="closeClassList()"
            />
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

        <div v-if="isEntering" ref="classList" class="card card-body p-1">
            <ClassList
                ref="enteringClassList"
                :courses="inputCourses"
                :schedule="schedule.currentSchedule"
                :is-entering="isEntering"
                @update_course="updateCourse"
                @close="closeClassList()"
            ></ClassList>
        </div>
        <div>
            <div class="mt-3">
                <button
                    class="btn btn-info nav-btn"
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
            </div>
            <div class="mx-1">
                <div class="mx-3">
                    <div
                        class="row no-gutters align-items-center justify-content-between"
                        style="font-size: 24px"
                    >
                        <div class="col-auto">
                            <i
                                class="fas fa-long-arrow-alt-left"
                                title="previous schedule"
                                :class="
                                    schedule.proposedScheduleIndex > 0
                                        ? 'click-icon'
                                        : 'icon-disabled'
                                "
                                @click="schedule.switchProposed(schedule.proposedScheduleIndex - 1)"
                            ></i>
                        </div>
                        <div class="col-auto" style="font-size: 20px;">
                            {{ schedule.proposedScheduleIndex + 1 }}
                        </div>
                        <div class="col-auto">
                            <i
                                class="fas fa-long-arrow-alt-right"
                                title="next schedule"
                                :class="
                                    schedule.proposedScheduleIndex <
                                    schedule.proposedSchedules.length - 1
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
                                :class="
                                    schedule.proposedSchedules.length > 1
                                        ? 'click-icon'
                                        : 'icon-disabled'
                                "
                                title="delete current schedule"
                                @click="schedule.deleteProposed()"
                            ></i>
                        </div>
                    </div>
                </div>
                <ClassList
                    ref="selectedClassList"
                    :courses="schedule.currentSchedule.currentCourses"
                    :schedule="schedule.currentSchedule"
                    :show-any="!schedule.generated"
                    @update_course="updateCourse"
                    @remove_course="removeCourse"
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
            </div>
        </div>
        <div class="btn bg-info nav-btn mt-2">
            Schedule Overview
        </div>
        <ul class="list-group list-group-flush" style="width:99%">
            <li class="list-group-item">
                Total Credits: {{ schedule.currentSchedule.totalCredit }}
            </li>
            <li class="list-group-item pr-0">
                <table style="width:100%;font-size:14px">
                    <tr v-for="item in currentIds" :key="item[0]">
                        <td>{{ item[0] }}</td>
                        <td>{{ item[1] }}</td>
                    </tr>
                </table>
            </li>
        </ul>
    </nav>
</template>

<script lang="ts" src="./ClassView.ts"></script>
