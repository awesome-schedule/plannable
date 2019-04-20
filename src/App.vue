<template>
    <div id="app" style="width:100%" @change="onDocChange">
        <a
            href="https://github.com/awesome-schedule/Awesome-SchedulAR"
            target="_blank"
            class="github-corner d-none d-sm-block"
            aria-label="View source on GitHub"
            ><svg
                width="80"
                height="80"
                viewBox="0 0 250 250"
                style="fill:#70B7FD; color:#fff; position: fixed; top: 0; border: 0; right: 0;z-index: 9999;"
                aria-hidden="true"
            >
                <path d="M0,0 L115,115 L130,115 L142,142 L250,250 L250,0 Z"></path>
                <path
                    d="M128.3,109.0 C113.8,99.7 119.0,89.6 119.0,89.6 C122.0,82.7 120.5,78.6 120.5,78.6 C119.2,72.0 123.4,76.3 123.4,76.3 C127.3,80.9 125.5,87.3 125.5,87.3 C122.9,97.6 130.6,101.9 134.4,103.2"
                    fill="currentColor"
                    style="transform-origin: 130px 106px;"
                    class="octo-arm"
                ></path>
                <path
                    d="M115.0,115.0 C114.9,115.1 118.7,116.5 119.8,115.4 L133.7,101.6 C136.9,99.2 139.9,98.4 142.2,98.6 C133.8,88.0 127.5,74.4 143.8,58.0 C148.5,53.4 154.0,51.2 159.7,51.0 C160.3,49.4 163.2,43.6 171.4,40.1 C171.4,40.1 176.1,42.5 178.8,56.2 C183.1,58.6 187.2,61.8 190.9,65.4 C194.5,69.0 197.7,73.2 200.1,77.6 C213.8,80.2 216.3,84.9 216.3,84.9 C212.7,93.1 206.9,96.0 205.4,96.6 C205.1,102.4 203.0,107.8 198.3,112.5 C181.9,128.9 168.3,122.5 157.7,114.1 C157.9,116.9 156.7,120.9 152.7,124.9 L141.0,136.5 C139.8,137.7 141.6,141.9 141.8,141.8 Z"
                    fill="currentColor"
                    class="octo-body"
                ></path>
            </svg>
        </a>
        <section-modal
            id="modal"
            :semester="currentSemester"
            :section="modalSection"
        ></section-modal>
        <course-modal :course="modalCourse"></course-modal>
        <!-- Tab Icons Start (Leftmost bar) -->
        <nav class="d-block bg-light tab-bar" :style="`width:3vw;max-height:${navHeight}`">
            <div
                class="tab-icon mt-0 mb-4"
                title="Select Classes"
                @click="switchSideBar('showSelectClass')"
            >
                <i class="far fa-calendar-alt"></i>
            </div>
            <div class="tab-icon mt-0 mb-4" title="Edit Events" @click="switchSideBar('showEvent')">
                <i class="fab fa-elementor"></i>
            </div>
            <div class="tab-icon mb-4" title="Filters" @click="switchSideBar('showFilter')">
                <i class="fas fa-filter"></i>
            </div>
            <div
                class="tab-icon mb-4"
                title="Display Settings"
                @click="switchSideBar('showSetting')"
            >
                <i class="fas fa-cog"></i>
            </div>
            <div
                class="tab-icon mb-4"
                title="Customize Colors"
                @click="switchSideBar('showSelectColor')"
            >
                <i class="fas fa-palette"></i>
            </div>
            <div
                class="tab-icon mb-4"
                title="Import/Export Schedule"
                @click="switchSideBar('showExport')"
            >
                <i class="fas fa-download"></i>
            </div>
            <div
                title="collapse searching results"
                class="tab-icon mb-4"
                @click="switchSideBar('showInfo')"
            >
                <i class="fas fa-info-circle"></i>
            </div>
            <div
                v-if="isEntering && sideBar.showSelectClass"
                title="Tutorials, miscellaneous information and acknowledgments"
                class="tab-icon mb-4"
                @click="closeClassList"
            >
                <i class="fas fa-caret-square-up"></i>
            </div>
        </nav>
        <!-- Tab Icons End (Leftmost bar) -->

        <nav
            v-if="sideBar.showSelectClass"
            class="d-block bg-light sidebar"
            style="scrollbar-width:thin !important"
        >
            <div class="dropdown" style="">
                <button
                    id="semester"
                    class="btn btn-info nav-btn mt-0"
                    type="button"
                    data-toggle="dropdown"
                >
                    <span
                        v-if="loading"
                        class="spinner-border spinner-border-sm"
                        role="status"
                        aria-hidden="true"
                    ></span>
                    {{ currentSemester === null ? 'Select Semester' : currentSemester.name }}
                </button>
                <div
                    v-if="semesters !== null"
                    class="dropdown-menu"
                    aria-labelledby="dropdownMenuButton"
                    style="width: 100%;"
                >
                    <a
                        v-for="(semester, idx) in semesters"
                        :key="semester.id"
                        class="dropdown-item"
                        style="width: 100%;"
                        href="#"
                        @click="selectSemester(idx)"
                        >{{ semester.name }}
                    </a>
                </div>
            </div>
            <div class="input-group mt-2">
                <input
                    type="text"
                    class="form-control"
                    placeholder="Title/Number/Topic/Professor"
                    style="font-size: 10pt"
                    @input="getClass($event.target.value)"
                    @keyup.esc="closeClassList($event)"
                />
            </div>

            <div v-if="isEntering" ref="classList" class="card card-body p-1">
                <ClassList
                    :courses="inputCourses"
                    :schedule="currentSchedule"
                    :is-entering="isEntering"
                    :show-classlist-title="showClasslistTitle"
                    :generated="generated"
                    @update_course="updateCourse"
                    @close="closeClassList"
                    @trigger-classlist-modal="showClassListModal"
                ></ClassList>
            </div>
            <div>
                <div class="mt-3">
                    <button
                        class="btn btn-info nav-btn"
                        :title="
                            generated
                                ? 'Click to edit selected classes'
                                : 'Click to edit generated schedules'
                        "
                        @click="switchSchedule(!generated)"
                    >
                        {{
                            generated
                                ? `Generated Schedule: ${currentScheduleIndex + 1}`
                                : 'Selected Classes'
                        }}
                    </button>
                </div>
                <div class="mx-1">
                    <div class="mx-4">
                        <div
                            class="row no-gutters align-items-center justify-content-between"
                            style="font-size: 24px"
                        >
                            <div class="col-md-auto">
                                <i
                                    class="fas fa-long-arrow-alt-left click-icon"
                                    title="previous schedule"
                                    @click="switchProposed(proposedScheduleIndex - 1)"
                                ></i>
                            </div>
                            <div class="col-md-auto" style="font-size: 20px;">
                                {{ proposedScheduleIndex + 1 }}
                            </div>
                            <div class="col-md-auto">
                                <i
                                    class="fas fa-long-arrow-alt-right click-icon"
                                    title="next schedule"
                                    @click="switchProposed(proposedScheduleIndex + 1)"
                                ></i>
                            </div>
                            <div class="col-md-auto">
                                <i
                                    class="far fa-calendar-plus click-icon"
                                    title="new schedule"
                                    @click="newProposed"
                                ></i>
                            </div>
                            <div class="col-md-auto">
                                <i
                                    class="far fa-copy click-icon"
                                    title="copy the current schedule to a new schedule"
                                    @click="copyCurrent"
                                >
                                </i>
                            </div>
                            <div class="col-md-auto">
                                <i
                                    class="far fa-calendar-times click-icon"
                                    title="delete current schedule"
                                    @click="deleteProposed"
                                ></i>
                            </div>
                        </div>
                    </div>
                    <ClassList
                        :courses="currentSchedule.currentCourses"
                        :schedule="currentSchedule"
                        :is-entering="isEntering"
                        :show-classlist-title="showClasslistTitle"
                        :generated="generated"
                        @update_course="updateCourse"
                        @remove_course="removeCourse"
                        @trigger-classlist-modal="showClassListModal"
                    ></ClassList>
                    <div class="btn-group mt-3" role="group" style="width:100%">
                        <button
                            type="button"
                            class="btn btn-outline-info"
                            @click="generateSchedules"
                        >
                            Generate
                        </button>
                        <button class="btn btn-outline-info" @click="clear">
                            Clean All
                        </button>
                    </div>
                </div>
            </div>
            <button class="btn btn-info nav-btn mt-3">
                Schedule Overview
            </button>
            <ul class="list-group list-group-flush" style="width:99%">
                <li class="list-group-item">Total Credits: {{ currentSchedule.totalCredit }}</li>
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

        <event-view
            v-else-if="sideBar.showEvent"
            :schedule="generated ? proposedSchedule : currentSchedule"
            :event="eventToEdit"
        >
        </event-view>

        <nav
            v-else-if="sideBar.showFilter"
            class="d-block bg-light sidebar"
            style="scrollbar-width:thin !important"
        >
            <button class="btn btn-info nav-btn">
                Filters
            </button>
            <ul class="list-group list-group-flush mx-1">
                <li
                    class="list-group-item px-3"
                    title="Time periods when you don't want to have class"
                >
                    No Class Time
                </li>
                <li v-for="(value, i) in timeSlots" :key="i" class="list-group-item p-1">
                    <table style="width:100%">
                        <tr>
                            <td>
                                <div class="btn-group mb-2" role="group" style="width:70%;">
                                    <button
                                        v-for="(day, j) in days"
                                        :key="j"
                                        :class="
                                            'btn btn-outline-secondary' +
                                                (value[j] ? ' active' : '')
                                        "
                                        type="button"
                                        @click="updateFilterDay(i, j)"
                                    >
                                        {{ day }}
                                    </button>
                                </div>
                                <input
                                    v-model="value[5]"
                                    type="time"
                                    min="8:00"
                                    max="22:00"
                                    style="-webkit-appearance:button"
                                />
                                -
                                <input
                                    v-model="value[6]"
                                    type="time"
                                    min="8:00"
                                    max="22:00"
                                    style="-webkit-appearance:button"
                                />
                            </td>
                            <td>
                                <button
                                    type="button"
                                    class="close"
                                    aria-label="Close"
                                    role="button"
                                    style="font-size:2rem"
                                    tabindex="-1"
                                >
                                    <span aria-hidden="true" @click="removeTimeSlot(i)"
                                        >&times;
                                    </span>
                                </button>
                            </td>
                        </tr>
                    </table>
                </li>
                <li
                    class="list-group-item filter-add"
                    style="text-align:center"
                    title="Click to add a time period when you don't want to have class"
                    @click="addTimeSlot"
                >
                    <i class="fas fa-plus"></i>
                </li>
                <li class="list-group-item">
                    <div class="custom-control custom-checkbox mt-2">
                        <input
                            id="awt"
                            v-model="allowWaitlist"
                            type="checkbox"
                            class="custom-control-input"
                        />
                        <label class="custom-control-label" for="awt">Allow Wait List</label>
                    </div>
                    <div class="custom-control custom-checkbox mt-1">
                        <input
                            id="ac"
                            v-model="allowClosed"
                            type="checkbox"
                            class="custom-control-input"
                        />
                        <label class="custom-control-label" for="ac">Allow Closed</label>
                    </div>
                </li>
                <li
                    class="list-group-item px-3"
                    title="Note that you can drag sort options to change their priority in fallback mode"
                >
                    Sort According to
                </li>
                <draggable
                    v-model="sortOptions.sortBy"
                    handle=".drag-handle"
                    @start="drag = true"
                    @end="
                        drag = false;
                        if (sortOptions.mode == 0) changeSorting(undefined);
                    "
                >
                    <div
                        v-for="(option, optIdx) in sortOptions.sortBy"
                        :key="option.name"
                        class="list-group-item py-1 pl-3 pr-0"
                    >
                        <div class="row no-gutters" style="width: 100%">
                            <div class="col col-sm-9 pr-1 drag-handle" :title="option.description">
                                <span class="sort-option"> {{ option.title }}</span>
                            </div>
                            <div class="col col-sm-3">
                                <i
                                    class="fas mr-2 click-icon"
                                    :class="option.reverse ? 'fa-arrow-down' : 'fa-arrow-up'"
                                    title="Click to reverse sorting"
                                    @click="
                                        option.reverse = !option.reverse;
                                        changeSorting(optIdx);
                                    "
                                ></i>
                                <div
                                    class="custom-control custom-checkbox sort-option"
                                    style="display: inline-block"
                                >
                                    <input
                                        :id="option.name"
                                        v-model="option.enabled"
                                        type="checkbox"
                                        class="custom-control-input"
                                        :value="option.name"
                                        @change="changeSorting(optIdx)"
                                    />
                                    <label
                                        class="custom-control-label"
                                        :for="option.name"
                                        title="Enable this sorting option"
                                    ></label>
                                </div>
                            </div>
                        </div>
                    </div>
                </draggable>
                <li class="list-group-item">
                    <template v-for="mode in sortModes">
                        <div :key="'sm' + mode.mode" class="custom-control custom-radio">
                            <input
                                :id="'sm' + mode.mode"
                                v-model.number="sortOptions.mode"
                                type="radio"
                                :value="mode.mode"
                                class="custom-control-input"
                                @change="changeSorting(undefined)"
                            />
                            <label
                                class="custom-control-label"
                                :for="'sm' + mode.mode"
                                :title="mode.description"
                                >{{ mode.title }}
                            </label>
                        </div>
                    </template>
                </li>
                <li class="list-group-item">
                    <button
                        type="button"
                        class="btn btn-outline-info"
                        style="width:100%"
                        @click="generateSchedules"
                    >
                        Apply
                    </button>
                </li>
            </ul>
        </nav>

        <nav
            v-else-if="sideBar.showSetting"
            class="d-block bg-light sidebar"
            style="scrollbar-width:thin !important"
        >
            <button class="btn btn-info nav-btn">
                Schedule Display settings
            </button>
            <div class="list-group list-group-flush mx-1">
                <div
                    class="input-group my-2"
                    title="Schedule grid earlier than this time won't be displayed if you don't have any class"
                >
                    <div class="input-group-prepend">
                        <span class="input-group-text">Schedule Start</span>
                    </div>
                    <input v-model="earliest" type="time" class="form-control" />
                </div>
                <div
                    class="input-group mb-2"
                    title="Schedule grid later than this time won't be displayed if you don't have any class"
                >
                    <div class="input-group-prepend">
                        <span class="input-group-text">Schedule End&nbsp;</span>
                    </div>
                    <input v-model="latest" type="time" class="form-control" />
                </div>
                <div class="input-group mb-2" title="height of a course on schedule">
                    <div class="input-group-prepend">
                        <span class="input-group-text">Class Height</span>
                    </div>
                    <input v-model.number="fullHeight" type="number" class="form-control" />
                    <div class="input-group-append">
                        <span class="input-group-text">px</span>
                    </div>
                </div>
                <div class="input-group mb-2" title="height of an empty row">
                    <div class="input-group-prepend">
                        <span class="input-group-text">Grid Height&nbsp;</span>
                    </div>
                    <input v-model.number="partialHeight" type="number" class="form-control" />
                    <div class="input-group-append">
                        <span class="input-group-text">px</span>
                    </div>
                </div>
            </div>
            <div v-if="mobile" class="custom-control custom-checkbox mb-3 ml-3">
                <input
                    id="scroll"
                    v-model="scrollable"
                    type="checkbox"
                    class="custom-control-input"
                />
                <label for="scroll" class="custom-control-label">
                    scrollable
                </label>
            </div>
            <button class="btn btn-info nav-btn">
                Display Options
            </button>
            <ul class="list-group list-group-flush mx-1">
                <li class="list-group-item">Course Display</li>
                <li class="list-group-item">
                    <div class="custom-control custom-checkbox">
                        <input
                            id="displayTime"
                            v-model="showTime"
                            type="checkbox"
                            class="custom-control-input"
                        />
                        <label for="displayTime" class="custom-control-label">
                            Show Time
                        </label>
                    </div>
                    <div class="custom-control custom-checkbox">
                        <input
                            id="displayRoom"
                            v-model="showRoom"
                            type="checkbox"
                            class="custom-control-input"
                        />
                        <label for="displayRoom" class="custom-control-label">
                            Show Room
                        </label>
                    </div>
                    <div class="custom-control custom-checkbox">
                        <input
                            id="displayInstructor"
                            v-model="showInstructor"
                            type="checkbox"
                            class="custom-control-input"
                        />
                        <label for="displayInstructor" class="custom-control-label">
                            Show instructor
                        </label>
                    </div>
                </li>
                <li class="list-group-item mb-0" style="border-bottom: 0">
                    <div class="custom-control custom-checkbox">
                        <input
                            id="displayClasslistTitle"
                            v-model="showClasslistTitle"
                            type="checkbox"
                            class="custom-control-input"
                        />
                        <label for="displayClasslistTitle" class="custom-control-label">
                            Show title on class list
                        </label>
                    </div>
                </li>
            </ul>
            <button class="btn btn-info nav-btn">
                Time Options
            </button>
            <ul class="list-group list-group-flush mx-1">
                <li>
                    <div class="btn-group my-3" role="group" style="width:100%">
                        <button
                            class="btn btn-secondary"
                            :class="{ active: standard }"
                            type="button"
                            @click="standard = true"
                        >
                            Standard
                        </button>
                        <button
                            class="btn btn-secondary"
                            :class="{ active: !standard }"
                            type="button"
                            @click="standard = false"
                        >
                            Military
                        </button>
                    </div>
                </li>
                <li class="list-group-item">
                    <button
                        class="btn btn-outline-info mb-1"
                        style="width: 100%"
                        @click="selectSemester(currentSemester.id, undefined, true)"
                    >
                        Update Semester Data
                    </button>
                </li>
                <li class="list-group-item">
                    <button class="btn btn-outline-danger" style="width: 100%" @click="clearCache">
                        Reset All and Clean
                    </button>
                </li>
            </ul>
        </nav>

        <nav v-else-if="sideBar.showExport" class="d-block bg-light sidebar">
            <button class="btn btn-info nav-btn">
                Import/Export Schedule
            </button>
            <ul class="list-group list-group-flush mx-1">
                <li class="list-group-item px-1">
                    <div class="custom-file">
                        <input
                            id="customFile"
                            type="file"
                            class="custom-file-input"
                            accept="text/json"
                            style="width:100%"
                            @change="onUploadJson($event)"
                        />
                        <label class="custom-file-label" for="customFile">Import From..</label>
                    </div>
                </li>
                <li class="list-group-item">
                    <a
                        class="btn btn-outline-dark"
                        style="width:100%"
                        :href="downloadURL"
                        download="schedule.json"
                        @click="saveToJson"
                        >Export
                    </a>
                </li>
                <li class="list-group-item">
                    <button class="btn btn-outline-primary" style="width: 100%" @click="print">
                        Print
                    </button>
                </li>
                <li class="list-group-item"></li>
            </ul>
        </nav>

        <palette v-else-if="sideBar.showSelectColor" :schedule="currentSchedule"></palette>

        <information v-else-if="sideBar.showInfo"></information>

        <transition name="fade">
            <div
                v-if="noti.msg.length > 0"
                id="noti"
                v-top
                class="alert mt-1 mb-0"
                :class="`alert-${noti.class}`"
                role="alert"
                :style="
                    `width:${mobile ? 'auto' : scheduleWidth - 10 + 'vw'}; margin-left:${
                        mobile ? '11' : scheduleLeft + 5
                    }vw;`
                "
            >
                {{ noti.msg }}
                <button
                    type="button"
                    class="close"
                    aria-label="Close"
                    style="align:center"
                    role="button"
                    @click="noti.clear()"
                >
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
        </transition>
        <div
            class="schedule"
            :style="
                `width:${
                    mobile ? (scrollable ? '200%' : '85%') : scheduleWidth + 'vw'
                }; margin-left:${mobile ? 11 : scheduleLeft}vw; margin-right: ${mobile ? '1vw' : 0}`
            "
        >
            <div class="container-fluid my-3">
                <div class="row justify-content-center">
                    <div v-if="generated && !generatedEmpty()" class="col">
                        <Pagination
                            :schedule-length="scheduleLength"
                            :cur-idx="tempScheduleIndex"
                            @switch_page="switchPage"
                        ></Pagination>
                    </div>
                </div>
            </div>
            <grid-schedule
                :schedule="currentSchedule"
                :show-time="showTime"
                :show-room="showRoom"
                :show-instructor="showInstructor"
                :full-height="+fullHeight"
                :partial-height="+partialHeight"
                :earliest="earliest"
                :latest="latest"
                :time-option-standard="standard"
                @trigger-modal="showModal"
                @editEvent="editEvent"
            ></grid-schedule>
            <div style="text-align: center" class="mb-2">
                If you find any bugs, please file an issue at
                <a href="https://github.com/awesome-schedule/Awesome-SchedulAR/issues"
                    >our GitHub repository</a
                >. We recommend Google Chrome for best experience.
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator';
import ClassList from './components/ClassList.vue';
import Pagination from './components/Pagination.vue';
import GridSchedule from './components/GridSchedule.vue';
import SectionModal from './components/SectionModal.vue';
import CourseModal from './components/CourseModal.vue';
import Palette from './components/Palette.vue';
import EventView from './components/EventView.vue';
import Information from './components/Information.vue';

import Section from './models/Section';
import Course from './models/Course';
import Schedule, { ScheduleJSON } from './models/Schedule';
import Catalog, { Semester } from './models/Catalog';
import Event from './models/Event';
import ScheduleGenerator from './algorithm/ScheduleGenerator';
import ScheduleEvaluator from './algorithm/ScheduleEvaluator';
import { getSemesterList, getSemesterData } from './data/DataLoader';
import Notification from './models/Notification';
import draggable from 'vuedraggable';
import { to12hr, parseTimeAsInt, timeout } from './models/Utils';
import Meta, { getDefaultData } from './models/Meta';

// these two properties must be non-reactive,
// otherwise the reative observer will slow down execution significantly
window.scheduleEvaluator = new ScheduleEvaluator();
// window.window.catalog = null;

@Component({
    components: {
        ClassList,
        Pagination,
        GridSchedule,
        SectionModal,
        CourseModal,
        draggable,
        Palette,
        EventView,
        Information
    }
})
export default class App extends Vue {
    [x: string]: any;

    name = 'App';

    semesters: Semester[] = [];
    currentSemester: Semester | null = null;
    currentScheduleIndex = 0;
    currentSchedule = new Schedule();

    proposedSchedules = [new Schedule()];
    proposedScheduleIndex = 0;
    /**
     * The index of the proposed schedule corresponding to the generated schedule
     */
    cpIndex = -1;
    /**
     * indicates whether the currently showing schedule is the generated schedule
     */
    generated = false;
    maxNumSchedules = Infinity;

    /**
     * sidebar display status
     * show the specific sidebar when true, and hide when all false
     */
    sideBar: { [x: string]: boolean } = {
        showSelectClass: window.screen.width / window.screen.height > 1 ? true : false,
        showEvent: false,
        showFilter: false,
        showSetting: false,
        showExport: false,
        showSelectColor: false,
        showInfo: false
    };

    // autocompletion related fields
    isEntering = false;

    inputCourses: Course[] | null = null;

    // modal object binding
    modalSection: Section | null = null;
    modalCourse: Course | null = null;

    // display options
    showTime = false;
    showRoom = true;
    showInstructor = true;
    showClasslistTitle = false;
    fullHeight = 40;
    partialHeight = 25;
    earliest = '08:00:00';
    latest = '19:00:00';
    standard = false;

    // filter settings
    /**
     * index 0 - 4: whether Mo - Tu are selected
     *
     * 6: start time, of 24 hour format
     *
     * 7: end time, of 24 hour format
     */
    timeSlots: Array<[boolean, boolean, boolean, boolean, boolean, string, string]> = [];
    allowWaitlist = true;
    allowClosed = true;
    sortOptions = ScheduleEvaluator.getDefaultOptions();
    sortModes = ScheduleEvaluator.sortModes;

    // other
    noti = new Notification();
    navHeight = 500;
    loading = false;
    mobile = window.screen.width < 900;
    scrollable = false;
    tempScheduleIndex: number | null = null;
    drag = false;
    downloadURL = '';
    days = Meta.days;
    eventToEdit: Event | null = null;

    get sideBarActive() {
        for (const key in this.sideBar) {
            if (this.sideBar[key]) return true;
        }
        return false;
    }
    get scheduleLength() {
        return Math.min(window.scheduleEvaluator.size(), this.maxNumSchedules);
    }
    get scheduleWidth() {
        return this.sideBarActive ? 100 - 19 - 3 - 5 : 100 - 3 - 3;
    }
    get scheduleLeft() {
        return this.sideBarActive ? 23 : 3;
    }
    /**
     * get the list of current ids, sorted in alpabetical order of the keys
     */
    get currentIds(): Array<[string, string]> {
        return Object.entries(this.currentSchedule.currentIds).sort((a, b) =>
            a[0] === b[0] ? 0 : a[0] < b[0] ? -1 : 1
        );
    }
    set proposedSchedule(schedule: Schedule) {
        this.proposedSchedules[this.proposedScheduleIndex] = schedule;
    }
    get proposedSchedule() {
        return this.proposedSchedules[this.proposedScheduleIndex];
    }

    @Watch('loading')
    loadingWatch() {
        if (this.mobile) {
            if (this.loading) this.noti.info('Loading...', 3600);
            else this.noti.clear();
        }
    }

    created() {
        this.navHeight = document.documentElement.clientHeight;
        this.loading = true;
        const storage = localStorage.getItem('semesters');
        if (!storage) {
            this.fetchSemesterList();
            return;
        }
        const sms = JSON.parse(storage);
        const modified = sms.modified;
        if (
            modified &&
            new Date().getTime() - new Date(modified).getTime() < Meta.semesterListExpirationTime
        ) {
            this.semesters = sms['semesterList'];
            this.selectSemester(0);
        } else {
            this.fetchSemesterList(undefined, () => {
                this.semesters = sms['semesterList'];
                this.selectSemester(0);
            });
        }
    }

    generatedEmpty() {
        return window.scheduleEvaluator.empty();
    }
    switchProposed(index: number) {
        if (index < this.proposedSchedules.length && index >= 0) {
            this.proposedScheduleIndex = index;
            this.switchSchedule(false);
        }
        this.saveStatus();
    }
    newProposed() {
        this.proposedSchedules.push(new Schedule());
        this.switchProposed(this.proposedSchedules.length - 1);
    }
    copyCurrent() {
        const len = this.proposedSchedules.length;
        this.proposedSchedules.push(this.proposedSchedules[len - 1].copy());
        this.switchProposed(len);
    }
    deleteProposed() {
        if (!confirm('Are you sure?')) return;
        if (this.proposedSchedules.length === 1) {
            return this.noti.error('This is the only schedule left!');
        }
        const idx = this.proposedScheduleIndex;

        // if the schedule to be deleted corresponds to generated schedules,
        // this deletion invalidates the generated schedules immediately.
        if (idx === this.cpIndex) {
            window.scheduleEvaluator.clear();
            this.cpIndex = -1;
        }
        this.proposedSchedules.splice(idx, 1);
        if (idx >= this.proposedSchedules.length) {
            this.switchProposed(idx - 1);
        }
        this.saveStatus();
    }

    editEvent(event: Event) {
        if (!this.sideBar.showEvent) this.switchSideBar('showEvent');
        this.eventToEdit = event;
    }

    switchSchedule(generated: boolean) {
        if (
            generated &&
            !window.scheduleEvaluator.empty() &&
            this.cpIndex === this.proposedScheduleIndex
        ) {
            if (!this.generated) {
                this.generated = true;
                this.proposedSchedule = this.currentSchedule;
                this.switchPage(
                    this.currentScheduleIndex === null ? 0 : this.currentScheduleIndex,
                    true
                );
            }
        } else {
            this.generated = false;
            this.currentSchedule = this.proposedSchedule;
        }
    }

    updateFilterDay(i: number, j: number) {
        this.$set(this.timeSlots[i], j, !this.timeSlots[i][j]);
    }

    switchSideBar(key: string) {
        this.getClass('');
        for (const other in this.sideBar) {
            if (other !== key) this.sideBar[other] = false;
        }
        this.sideBar[key] = !this.sideBar[key];

        if (this.sideBar.showSelectColor) this.switchSchedule(true);
    }

    fetchSemesterList(success?: () => void, reject?: () => void) {
        timeout(getSemesterList(), 10000)
            .then(res => {
                this.semesters = res;
                localStorage.setItem(
                    'semesters',
                    JSON.stringify({
                        modified: new Date().toJSON(),
                        semesterList: res
                    })
                );
                // get the latest semester
                this.selectSemester(0);
                if (typeof success === 'function') success();
            })
            .catch(err => {
                console.warn(err);
                let errStr = `Failed to fetch semester list: `;
                if (typeof err === 'string') errStr += err;
                else if (err.response) errStr += `request rejected by the server. `;
                else if (err.request) errStr += `No response received. `;
                if (typeof reject === 'function') {
                    errStr += 'Old data is used instead';
                    this.noti.warn(errStr);
                    this.loading = false;
                    reject();
                    return;
                }
                this.noti.error(errStr);
                this.loading = false;
            });
    }
    onDocChange() {
        this.saveStatus();
    }
    print() {
        window.print();
    }
    clear() {
        this.currentSchedule.clean();
        this.proposedSchedule.clean();
        this.generated = false;
        window.scheduleEvaluator.clear();
        this.cpIndex = -1;
        this.saveStatus();
    }
    cleanSchedules() {
        this.switchSchedule(false);
        window.scheduleEvaluator.clear();
        this.currentSchedule.cleanSchedule();
    }
    clearCache() {
        if (confirm('Your selected classes and schedules will be cleaned. Are you sure?')) {
            this.currentSchedule.clean();
            this.generated = false;
            window.scheduleEvaluator.clear();
            localStorage.clear();
            this.cpIndex = -1;
        }
    }

    showModal(section: Section) {
        this.modalSection = section;
    }

    showClassListModal(course: Course) {
        this.modalCourse = course;
        (window as any).$('#course-modal').modal();
    }

    removeCourse(key: string) {
        this.currentSchedule.remove(key);
        if (this.generated) {
            this.noti.warn(`You're editing the generated schedule!`, 3);
        } else {
            this.saveStatus();
        }
    }
    /**
     * @see Schedule.update
     */
    updateCourse(key: string, section: number) {
        this.currentSchedule.update(key, section, true, this.isEntering);
        if (this.generated) {
            this.noti.warn(`You're editing the generated schedule!`, 3);
        } else {
            this.saveStatus();
        }
    }
    /**
     * Switch to `idx` page. If update is true, also update the pagination status.
     * @param idx
     * @param update  whether to update the pagination status
     */
    switchPage(idx: number, update = false) {
        if (0 <= idx && idx < Math.min(window.scheduleEvaluator.size(), this.maxNumSchedules)) {
            this.currentScheduleIndex = idx;
            if (update) {
                this.tempScheduleIndex = idx;
            } else {
                this.tempScheduleIndex = null;
            }
            this.currentSchedule = window.scheduleEvaluator.getSchedule(idx);
            this.saveStatus();
        }
    }
    /**
     * get classes that match the input query.
     * Exit "entering" mode on falsy parameter (set `isEntering` to false)
     *
     * @see Catalog.search
     */
    getClass(query: string) {
        if (!query) {
            this.isEntering = false;
            this.inputCourses = null;
            return;
        }
        // if current schedule is displayed, switch to proposed schedule
        if (this.generated) {
            this.switchSchedule(false);
        }
        this.inputCourses = window.catalog.search(query);
        this.isEntering = true;
    }
    /**
     * Select a semester and fetch all its associated data.
     *
     * This method will assign a correct Catalog object to `window.catalog`
     * which will be either requested from remote or parsed from `localStorage`
     *
     * After that, schedules and settings will be parsed from `localStorage`
     * and assigned to relevant fields of `this`.
     * If no local data is present, then default values will be assigned.
     * @param semesterId index or id of this semester
     * @param parsed_data
     * @param force whether to force-update semester data
     */
    selectSemester(
        semesterId: number | string,
        parsed_data: { [x: string]: any } | undefined = undefined,
        force = false
    ) {
        if (typeof semesterId === 'string') {
            for (let i = 0; i < this.semesters.length; i++) {
                const semester = this.semesters[i];
                if (semester.id === semesterId) {
                    semesterId = i;
                    break;
                }
            }
            // not found: return
            if (typeof semesterId === 'string') return;
        }

        this.currentSemester = this.semesters[semesterId];
        this.loading = true;
        const data = localStorage.getItem(this.currentSemester.id);
        const allRecords_raw = localStorage.getItem(`${this.currentSemester.id}data`);

        /**
         * The callback that gets executes when no local data is present
         */
        const defaultCallback = () => {
            this.generated = false;
            window.scheduleEvaluator.clear();
            const defaultData = getDefaultData();
            for (const field of Meta.storageFields) {
                if (field !== 'currentSemester') this[field] = defaultData[field];
            }
            this.saveAllRecords();
            this.saveStatus();
            this.loading = false;
        };
        let raw_data: { [x: string]: any };
        if (parsed_data) {
            raw_data = parsed_data;
        } else if (data) {
            raw_data = JSON.parse(data);
        } else {
            this.fetchSemesterData(semesterId, defaultCallback);
            return;
        }

        // storage version mismatch implies API update: use dafault data instead
        if (Meta.storageVersion !== raw_data.storageVersion) {
            // clear local storage
            localStorage.clear();
            this.fetchSemesterData(semesterId, defaultCallback);
            return;
        }
        const temp = Catalog.fromJSON(JSON.parse(allRecords_raw as string));

        /**
         * The callback that gets executes after the global `Catalog` object is assigned
         */
        const callback = () => {
            this.generated = false;
            window.scheduleEvaluator.clear();
            this.parseLocalData(raw_data);
            this.loading = false;
        };

        // if data does not exist or is not in correct format
        if (temp === null) {
            this.fetchSemesterData(semesterId, () => {
                this.saveAllRecords();
                callback();
            });
        } else {
            // if data expired
            if (temp.expired || force) {
                if (force) this.noti.info(`Updating ${this.currentSemester.name} data...`, 5);
                // in this case, we only need to update window.catalog. Save a set of fresh data
                this.fetchSemesterData(
                    semesterId,
                    () => {
                        this.saveAllRecords();
                        if (force) this.noti.success('Success!', 3);
                        callback();
                    },
                    () => {
                        // if failed, just use the old data.
                        window.catalog = temp.catalog;
                        callback();
                    }
                );
            } else {
                window.catalog = temp.catalog;
                callback();
            }
        }
    }

    saveAllRecords() {
        if (!this.currentSemester) return;

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.endsWith('data')) {
                localStorage.removeItem(key);
            }
        }
        localStorage.setItem(
            `${this.currentSemester.id}data`,
            JSON.stringify(window.catalog.toJSON())
        );
    }
    /**
     * fetch basic class data for the given semester for fast class search and rendering
     * this method will assign to the global `window.catalog` object
     *
     * This method will set the flag `loading` to true on start, to false on return.
     * When on error, a proper error message will be displayed to the user.
     *
     * @param {()=>void} [success] func to execute on success
     * @param {()=>void} [reject] func to execute on failure
     */
    fetchSemesterData(semesterIdx: number, success?: () => void, reject?: () => void) {
        this.loading = true;
        timeout(getSemesterData(this.semesters[semesterIdx].id), 10000)
            .then(data => {
                window.catalog = new Catalog(this.currentSemester as Semester, data);
                if (typeof success === 'function') {
                    success();
                    this.loading = false;
                }
            })
            .catch(err => {
                console.warn(err);
                let errStr = `Failed to fetch ${this.semesters[semesterIdx].name}: `;
                if (typeof err === 'string') errStr += err;
                else if (err.response) errStr += `request rejected by the server. `;
                else if (err.request) errStr += `No response received. `;
                if (typeof reject === 'function') {
                    errStr += 'Old data is used instead';
                    reject();
                    this.noti.warn(errStr);
                    this.loading = false;
                    return;
                }
                this.noti.error(errStr);
                this.loading = false;
            });
    }
    closeClassList(event: { target: HTMLInputElement }) {
        event.target.value = '';
        this.getClass('');
    }
    generateSchedules(parsed = false) {
        if (this.generated) this.currentSchedule = this.proposedSchedule;
        this.generated = false;

        if (this.currentSchedule.empty())
            return this.noti.warn(`There are no classes in your schedule!`);

        const constraintStatus = [];
        if (!this.allowWaitlist) {
            constraintStatus.push('Wait List');
        }
        if (!this.allowClosed) {
            constraintStatus.push('Closed');
        }

        const timeFilters = this.computeFilter();

        // null means there's an error processing time filters. Don't continue if that's the case
        if (timeFilters === null) return;
        this.loading = true;
        const generator = new ScheduleGenerator(window.catalog);

        try {
            const evaluator = generator.getSchedules(this.currentSchedule, {
                events: this.currentSchedule.events,
                timeSlots: timeFilters,
                status: constraintStatus,
                sortOptions: this.sortOptions
            });
            window.scheduleEvaluator.clear();
            window.scheduleEvaluator = evaluator;
            this.saveStatus();
            this.noti.success(`${window.scheduleEvaluator.size()} Schedules Generated!`, 3);
            this.cpIndex = this.proposedScheduleIndex;
            this.switchSchedule(true);
            this.loading = false;
        } catch (err) {
            console.warn(err);
            this.generated = false;
            window.scheduleEvaluator.clear();
            this.noti.error(err.message);
            this.saveStatus();
            this.cpIndex = -1;
            this.loading = false;
        }
    }

    changeSorting(optIdx: number) {
        if (!Object.values(this.sortOptions.sortBy).some(x => x.enabled)) {
            return this.noti.error('You must have at least one sort option!');
        }
        if (optIdx !== undefined) {
            const option = this.sortOptions.sortBy[optIdx];
            if (option.enabled) {
                for (const key of option.exclusive) {
                    for (const opt of this.sortOptions.sortBy) {
                        if (opt.name === key) opt.enabled = false;
                    }
                }
            }
        }
        if (!window.scheduleEvaluator.empty()) {
            this.loading = true;
            window.scheduleEvaluator.changeSort(this.sortOptions, true);
            if (!this.generated) {
                this.switchSchedule(true);
            } else {
                this.currentSchedule = window.scheduleEvaluator.getSchedule(
                    this.currentScheduleIndex
                );
            }
            this.loading = false;
        }
    }

    saveStatus() {
        if (!this.currentSemester) return;

        const obj: { [x: string]: any } = Object.create(null);
        for (const field of Meta.storageFields) {
            obj[field] = this[field];
        }
        obj.storageVersion = Meta.storageVersion;
        // note: toJSON() will automatically be called if such method exists on an object
        localStorage.setItem(this.currentSemester.id, JSON.stringify(obj));
    }

    parseLocalData(raw_data: { [x: string]: any }) {
        const defaultData = getDefaultData();
        for (const field of Meta.storageFields) {
            if (field === 'proposedSchedules') {
                // if true, we're dealing legacy code
                if (raw_data.proposedSchedule) {
                    this.proposedScheduleIndex = 0;
                    const s = Schedule.fromJSON(raw_data.proposedShedule);
                    if (s) this.proposedSchedule = s;
                } else {
                    const schedules: ScheduleJSON[] | undefined = raw_data.proposedSchedules;
                    if (schedules && schedules.length) {
                        const propSchedules = [];
                        for (const schedule of schedules) {
                            const temp = Schedule.fromJSON(schedule);
                            if (temp) propSchedules.push(temp);
                        }

                        if (propSchedules.length) this.proposedSchedules = propSchedules;
                        else this.proposedSchedules = defaultData.proposedSchedules;

                        this.proposedScheduleIndex =
                            raw_data.proposedScheduleIndex === undefined
                                ? 0
                                : raw_data.proposedScheduleIndex;
                    } else {
                        this.proposedSchedules = defaultData[field];
                    }
                }
            } else if (this[field] instanceof Array) {
                const raw_arr = raw_data[field];
                if (raw_arr instanceof Array) {
                    this[field] = raw_arr;
                } else this[field] = defaultData[field];
            } else if (this[field] instanceof Object) {
                if (typeof this[field].fromJSON === 'function') {
                    const parsed = this[field].fromJSON(raw_data[field]);
                    if (parsed) this[field] = parsed;
                    else {
                        this.noti.warn(`Fail to parse ${field}`);
                        this[field] = defaultData[field];
                    }
                } else {
                    if (
                        Object.keys(this[field])
                            .sort()
                            .toString() ===
                        Object.keys(raw_data[field])
                            .sort()
                            .toString()
                    )
                        this[field] = raw_data[field];
                    else this[field] = defaultData[field];
                }
            } else if (typeof raw_data[field] === typeof this[field]) this[field] = raw_data[field];
            else {
                this[field] = defaultData[field];
            }
        }
        if (!this.proposedSchedule.empty()) {
            this.currentSchedule = this.proposedSchedule;
            this.generateSchedules(true);
        }
    }
    removeTimeSlot(n: number) {
        this.timeSlots.splice(n, 1);
    }
    addTimeSlot() {
        this.timeSlots.push([false, false, false, false, false, '', '']);
    }
    /**
     * Preprocess the time filters so that they are of the correct format
     *
     * returns null on parsing error
     */
    computeFilter(): Event[] | null {
        const timeSlotsRecord = [];
        for (const time of this.timeSlots) {
            let days = '';
            for (let j = 0; j < 5; j++) {
                if (time[j]) days += Meta.days[j];
            }

            if (!days) continue;

            const startTime = time[5].split(':');
            const endTime = time[6].split(':');
            if (
                isNaN(+startTime[0]) ||
                isNaN(+startTime[1]) ||
                isNaN(+endTime[0]) ||
                isNaN(+endTime[1])
            ) {
                this.noti.error('Invalid time input.');
                return null;
            }
            days += ' ' + to12hr(time[5]) + ' - ' + to12hr(time[6]);
            timeSlotsRecord.push(new Event(days, false));
        }
        return timeSlotsRecord;
    }
    onUploadJson(event: { target: HTMLInputElement }) {
        const input = event.target;
        if (!input.files) return;

        const reader = new FileReader();
        try {
            reader.onload = () => {
                if (reader.result) {
                    const result = reader.result.toString();
                    localStorage.setItem((this.currentSemester as Semester).id, result);
                    const raw_data = JSON.parse(result);
                    const semester = raw_data.currentSemester;
                    for (let i = 0; i < this.semesters.length; i++) {
                        if (this.semesters[i].id === semester.id) {
                            this.selectSemester(i, raw_data);
                            break;
                        }
                    }
                }
            };
            reader.readAsText(input.files[0]);
        } catch (error) {
            console.warn(error);
            this.noti.error(error.message);
        }
    }
    saveToJson() {
        if (!this.currentSemester) return;

        const json = localStorage.getItem(this.currentSemester.id);
        if (json) {
            const blob = new Blob([json], { type: 'text/json' });
            let url = window.URL.createObjectURL(blob);
            this.downloadURL = url;
            url = url.substring(5);
            window.URL.revokeObjectURL(url);
        }
    }
}
</script>

<style scoped>
.list-group-item {
    background-color: #f8f8f8;
}
</style>

<style>
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.4s;
}
.fade-enter, .fade-leave-to /* .fade-leave-active below version 2.1.8 */ {
    opacity: 0;
}
.tab-icon {
    font-size: 1.8vw;
    margin-left: 20%;
    color: #5e5e5e;
}
.tab-icon:hover {
    color: #3e3e3e;
}
.tab-icon:active {
    color: #bbbbbb;
}

.click-icon {
    cursor: pointer;
}

.click-icon:hover {
    color: #3e3e3e;
}
.click-icon:active {
    color: #bbbbbb;
}

.sidebar {
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    z-index: 100; /* Behind the navbar */
    box-shadow: inset -1px 0 0 rgba(0, 0, 0, 0.1);
    overflow-y: auto;
    left: 3vw;
    width: 19vw;
}

.tab-bar {
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    z-index: 100; /* Behind the navbar */
    padding: 26px 0 0;
    box-shadow: inset -1px 0 0 rgba(0, 0, 0, 0.1);
}

/* for tab icons in navigation bar */
.nav-btn {
    border-radius: 0 !important;
    width: 100%;
}

.filter-add:hover {
    background-color: rgba(223, 223, 223, 0.5);
}

.sort-option {
    cursor: pointer;
}

.github-corner:hover .octo-arm {
    animation: octocat-wave 560ms ease-in-out;
}

@keyframes octocat-wave {
    0%,
    100% {
        transform: rotate(0);
    }

    20%,
    60% {
        transform: rotate(-25deg);
    }

    40%,
    80% {
        transform: rotate(10deg);
    }
}

@media (max-width: 500px) {
    .github-corner:hover .octo-arm {
        animation: none;
    }

    .github-corner .octo-arm {
        animation: octocat-wave 560ms ease-in-out;
    }
}

@media print {
    @page {
        size: A4 landscape;
        page-break-before: avoid;
        margin: 0.8cm 0.8cm 0.8cm 0.8cm;
    }

    nav {
        display: none !important;
    }

    div .schedule {
        width: calc(100vw - 1.6cm) !important;
        height: calc(100vw - 1.6cm) !important;
        margin: 0.8cm 0.8cm 0.8cm 0.8cm !important;
    }

    div #noti {
        display: none !important;
    }

    .github-corner {
        display: none !important;
    }
}

@media (max-width: 900px) {
    /* .schedule {
        width: 85% !important;
        margin-left: 11vw !important;
    } */

    .sidebar {
        position: fixed;
        top: 0;
        bottom: 0;
        left: 0;
        z-index: 10; /* Behind the navbar */
        box-shadow: inset -1px 0 0 rgba(0, 0, 0, 0.1);
        overflow-y: auto;
        left: 10vw !important;
        width: 75vw !important;
    }

    .nav-btn {
        border-radius: 0 !important;
        width: 100%;
    }

    .tab-bar {
        display: block;
        position: fixed;
        top: 0;
        bottom: 0;
        left: 0;
        z-index: 10; /* Behind the navbar */
        padding: 26px 0 0;
        box-shadow: inset -1px 0 0 rgba(0, 0, 0, 0.1);
        width: 10vw !important;
    }

    .tab-icon {
        font-size: 6vw;
        margin-left: 20%;
        color: #5e5e5e;
    }
}

.sidebar::-webkit-scrollbar {
    width: 5px;
}

.sidebar::-webkit-scrollbar-thumb {
    width: 5px;
    background-color: #ccc;
}
</style>
