<template>
    <div id="app" style="width:100%" @change="onDocChange">
        <modal id="modal" :course="modalCourse"></modal>
        <ClassListModal id="class-list-modal" :course="classListModalCourse"></ClassListModal>
        <!-- Tab Icons Start (Leftmost bar) -->
        <nav class="d-block bg-light tab-bar" :style="`width:3vw;max-height:${navHeight}`">
            <div
                class="tab-icon mt-0 mb-4"
                title="Select Classes"
                @click="
                    showSelectClass = !showSelectClass;
                    showFilter = false;
                    showSetting = false;
                    showExport = false;
                    getClass(null);
                "
            >
                <i class="far fa-calendar-alt"></i>
            </div>
            <div
                class="tab-icon mb-4"
                title="Filters"
                @click="
                    showFilter = !showFilter;
                    showSelectClass = false;
                    showSetting = false;
                    showExport = false;
                    getClass(null);
                "
            >
                <i class="fas fa-filter"></i>
            </div>
            <div
                class="tab-icon mb-4"
                title="Display Settings"
                @click="
                    showSetting = !showSetting;
                    showSelectClass = false;
                    showFilter = false;
                    showExport = false;
                    getClass(null);
                "
            >
                <i class="fas fa-cog"></i>
            </div>
            <div
                class="tab-icon mb-4"
                title="Import/Export Schedule"
                @click="
                    showExport = !showExport;
                    showSelectClass = false;
                    showFilter = false;
                    showSetting = false;
                    getClass(null);
                "
            >
                <i class="fas fa-download"></i>
            </div>
            <div
                v-if="isEntering && showSelectClass"
                title="collapse searching results"
                class="tab-icon mb-4"
                @click="closeClassList"
            >
                <i class="fas fa-caret-square-up"></i>
            </div>
        </nav>
        <!-- Tab Icons End (Leftmost bar) -->

        <nav v-if="sideBar && showSelectClass" class="d-block bg-light sidebar">
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
                        @click="
                            if (!scheduleEvaluator.empty()) {
                                if (generated) {
                                    currentSchedule = proposedSchedule;
                                } else switchPage(currentScheduleIndex, true);
                                generated = !generated;
                            }
                        "
                    >
                        {{
                            generated
                                ? `Generated Schedule: ${currentScheduleIndex + 1}`
                                : 'Selected Classes'
                        }}
                    </button>
                </div>
                <div class="mx-1">
                    <ClassList
                        :courses="currentSchedule.currentCourses"
                        :schedule="currentSchedule"
                        :is-entering="isEntering"
                        :show-classlist-title="showClasslistTitle"
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
                Semester Overview
            </button>
            <ul class="list-group list-group-flush" style="width:99%">
                <li class="list-group-item">Total Credits: {{ totalCredit }}</li>
            </ul>
        </nav>

        <nav v-if="sideBar && showFilter" class="d-block bg-light sidebar">
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
                <li v-for="(value, n) in timeSlots" :key="n" class="list-group-item p-1">
                    <table style="width:100%">
                        <tr>
                            <td>
                                <input
                                    v-model="value[0]"
                                    type="time"
                                    min="8:00"
                                    max="22:00"
                                    style="-webkit-appearance:button"
                                />
                                -
                                <input
                                    v-model="value[1]"
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
                                    <span aria-hidden="true" @click="removeTimeSlot(n)"
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
                <li class="list-group-item px-3">Sort According to</li>
                <draggable
                    v-model="sortOptions.sortBy"
                    @start="drag = true"
                    @end="
                        drag = false;
                        if (sortOptions.mode == 0) changeSorting(undefined);
                    "
                >
                    <div
                        v-for="(option, optIdx) in sortOptions.sortBy"
                        :key="option.name"
                        class="list-group-item sort-option py-1 pl-3 pr-0"
                    >
                        <div class="row no-gutters" style="width: 100%">
                            <div class="col col-sm-9 pr-1" :title="option.description">
                                {{ option.title }}
                            </div>
                            <div class="col col-sm-3">
                                <i
                                    class="fas mr-2"
                                    :class="option.reverse ? 'fa-arrow-down' : 'fa-arrow-up'"
                                    title="Click to reverse sorting"
                                    @click="
                                        option.reverse = !option.reverse;
                                        changeSorting(optIdx);
                                    "
                                ></i>
                                <div
                                    class="custom-control custom-checkbox"
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
                                        title="Make classes back-to-back"
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
            </ul>
        </nav>

        <nav v-if="sideBar && showSetting" class="d-block bg-light sidebar">
            <button class="btn btn-info nav-btn">
                Schedule Display settings
            </button>
            <div class="list-group list-group-flush mx-1">
                <div
                    class="input-group my-3"
                    title="Schedule grid earlier than this time won't be displayed if you don't have any class"
                >
                    <div class="input-group-prepend">
                        <span class="input-group-text">Start of My Day</span>
                    </div>
                    <input v-model="earliest" type="time" class="form-control" />
                </div>
                <div
                    class="input-group mb-3"
                    title="Schedule grid later than this time won't be displayed if you don't have any class"
                >
                    <div class="input-group-prepend">
                        <span class="input-group-text">End of My Day</span>
                    </div>
                    <input v-model="latest" type="time" class="form-control" />
                </div>
                <div class="input-group mb-3" title="height of a course on schedule">
                    <div class="input-group-prepend">
                        <span class="input-group-text">Class Height</span>
                    </div>
                    <input v-model="fullHeight" type="number" class="form-control" />
                    <div class="input-group-append">
                        <span class="input-group-text">px</span>
                    </div>
                </div>
                <div class="input-group mb-3" title="height of an empty row">
                    <div class="input-group-prepend">
                        <span class="input-group-text">Grid Height</span>
                    </div>
                    <input v-model="partialHeight" type="number" class="form-control" />
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
                <li class="list-group-item">Class List Display</li>
                <li class="list-group-item mb-1">
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
                    <button class="btn btn-outline-danger" style="width: 100%" @click="clearCache">
                        Reset All and Clean
                    </button>
                </li>
            </ul>
        </nav>

        <nav v-if="sideBar && showExport" class="d-block bg-light sidebar">
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
                    <div v-if="generated && !scheduleEvaluator.empty()" class="col">
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

<script>
import Vue from 'vue';
import ClassList from './components/ClassList.vue';
import Pagination from './components/Pagination.vue';
import GridSchedule from './components/GridSchedule.vue';
import Modal from './components/Modal.vue';
import ClassListModal from './components/ClassListModal.vue';
// eslint-disable-next-line
import Section from './models/Section';
import Schedule from './models/Schedule';
// eslint-disable-next-line
import Course from './models/Course';
import Catalog from './models/Catalog';
// import axios from 'axios';
import ScheduleGenerator from './algorithm/ScheduleGenerator';
import ScheduleEvaluator, { SortModes } from './algorithm/ScheduleEvaluator';
import { getSemesterList, getSemesterData } from './data/DataLoader';
import Notification from './models/Notification';
import draggable from 'vuedraggable';

Vue.directive('top', {
    // When the bound element is inserted into the DOM...
    inserted: el => {
        // Focus the element
        window.scrollTo(0, 0);
    }
});

/**
 * use a standalone method to get rid of deep copy issues
 */
function getDefaultData() {
    return {
        api:
            window.location.host.indexOf('localhost') === -1 &&
            window.location.host.indexOf('127.0.0.1') === -1
                ? `${window.location.protocol}//${window.location.host}/api`
                : 'http://localhost:8000/api',
        /**
         * @type {Semester[]}
         */
        semesters: null,
        /**
         * @type {Semester}
         */
        currentSemester: null,
        /**
         * @type {Catalog}
         */
        catalog: null,
        currentScheduleIndex: 0,
        /**
         * @type {Schedule}
         */
        currentSchedule: new Schedule(),
        /**
         * @type {Schedule}
         */
        proposedSchedule: new Schedule(),
        /**
         * indicates whether the currently showing schedule is the generated schedule
         */
        generated: false,
        scheduleEvaluator: new ScheduleEvaluator(),
        maxNumSchedules: Infinity,

        // sidebar display status
        /***
         * show left sidebar when true, and hide when false
         */
        sideBar: true,
        /**
         * when true, show the select-class sidebar if 'sideBar' is also true
         */
        showSelectClass: window.screen.width / window.screen.height > 1 ? true : false,
        /**
         * when true, show the filter sidebar if 'sideBar' is also true
         */
        showFilter: false,
        /**
         * when true, show the settings sidebar if 'sideBar' is also true
         */
        showSetting: false,
        showExport: false,

        // autocompletion related fields
        isEntering: false,
        /**
         * @type {Course[]}
         */
        inputCourses: null,

        // modal object binding
        /**
         * @type {Course}
         */
        modalCourse: null,
        /**
         * A course record to be displayed on Modal
         * @type {CourseRecord}
         */
        classListModalCourse: null,

        // input options
        showTime: true,
        showRoom: false,
        showInstructor: true,
        showClasslistTitle: false,
        fullHeight: 40,
        partialHeight: 25,
        /**
         * @type {[string, string][]}
         */
        timeSlots: [],
        allowWaitlist: true,
        allowClosed: true,
        // sortOptions: ScheduleEvaluator.optionDefaults,
        downloadURL: '',

        // storage related fields
        storageVersion: 2,
        storageFields: [
            // schedules
            // note: this field is for uploadJSON
            'currentScheduleIndex',

            'currentSemester',
            'currentSchedule',
            'proposedSchedule',
            'sortOptions',
            // settings
            'allowWaitList',
            'allowClosed',
            'showTime',
            'showRoom',
            'showInstructor',
            'showClasslistTitle',
            'fullHeight',
            'partialHeight',
            'timeSlots',
            'storageVersion',
            'earliest',
            'latest'
        ],

        // other
        noti: new Notification(),
        cache: true,
        navHeight: 500,
        loading: false,
        mobile: window.screen.width < 900,
        scrollable: false,
        semesterListExpirationTime: 86400 * 1000, // one day
        semesterDataExpirationTime: 2 * 3600 * 1000, // two hours
        earliest: '08:00:00',
        latest: '19:00:00',
        tempScheduleIndex: null,
        drag: false,
        sortOptions: ScheduleEvaluator.getDefaultOptions(),
        sortModes: ScheduleEvaluator.sortModes,
        standard: false
    };
}
/**
 * @template T
 * @param {Promise<T>} promise
 * @param {number} time
 * @return {Promise<T>}
 */
function timeout(promise, time) {
    return Promise.race([
        promise,
        new Promise((resolve, reject) => {
            setTimeout(() => {
                reject('Time out fetching data. Please try again later');
            }, time);
        })
    ]);
}

/**
 * @typedef {{id: string, name: string}} Semester
 */
/**
 * Raw Schedule
 * @typedef {[string, number, number][]} RawSchedule
 */

export default Vue.extend({
    name: 'App',
    components: {
        ClassList,
        Pagination,
        GridSchedule,
        Modal,
        ClassListModal,
        draggable
    },
    data() {
        return getDefaultData();
    },
    computed: {
        /**
         * @return {number}
         */
        scheduleLength() {
            return Math.min(this.scheduleEvaluator.size(), this.maxNumSchedules);
        },
        /**
         * @returns {number}
         */
        scheduleWidth() {
            return this.sideBar &&
                (this.showSelectClass || this.showFilter || this.showSetting || this.showExport)
                ? 100 - 19 - 3 - 5
                : 100 - 3 - 3;
        },
        /**
         * @returns {number}
         */
        scheduleLeft() {
            return this.sideBar &&
                (this.showSelectClass || this.showFilter || this.showSetting || this.showExport)
                ? 23
                : 3;
        },
        /**
         * @returns {number}
         */
        totalCredit() {
            return this.currentSchedule.totalCredit;
        }
    },
    watch: {
        loading() {
            if (this.mobile) {
                if (this.loading) this.noti.info('Loading...', 3600);
                else this.noti.clear();
            }
        }
    },
    created() {
        // axios.get(`${this.api}/semesters`).then(res => {
        //     this.semesters = res.data;
        //     // get the latest semester
        //     this.selectSemester(this.semesters.length - 1);
        // });
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
            new Date().getTime() - new Date(modified).getTime() < this.semesterListExpirationTime
        ) {
            this.semesters = sms['semesterList'];
            this.selectSemester(0);
        } else {
            this.fetchSemesterList(undefined, () => {
                this.semesters = sms['semesterList'];
            });
        }
    },
    methods: {
        /**
         * @param {()=>void} success
         * @param {()=>void} reject
         */
        fetchSemesterList(success, reject) {
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
                    if (typeof success === 'function') callback();
                })
                .catch(err => {
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
        },
        onDocChange() {
            this.saveStatus();
        },
        print() {
            window.print();
        },
        clear() {
            this.currentSchedule.clean();
            this.proposedSchedule.clean();
            this.generated = false;
            this.scheduleEvaluator.clear();
            this.saveStatus();
        },
        cleanSchedules() {
            this.scheduleEvaluator.clear();
            this.currentSchedule.cleanSchedule();
        },
        clearCache() {
            this.currentSchedule.clean();
            this.generated = false;
            this.scheduleEvaluator.clear();
            localStorage.clear();
        },

        /**
         * @param {Course} course
         */
        showModal(course) {
            this.modalCourse = course;
        },

        /**
         * @param {CourseRecord} course
         */
        showClassListModal(course) {
            this.classListModalCourse = course;
            $('class-list-modal').modal();
        },
        /**
         * @param {string} key
         */
        removeCourse(key) {
            this.currentSchedule.remove(key);
            if (this.generated) {
                this.noti.warn(`You're editing the generated schedule!`, 3);
            } else {
                this.saveStatus();
            }
        },
        /**
         * @see Schedule.update
         * @param {string} key
         * @param {number} section
         */
        updateCourse(key, section) {
            this.currentSchedule.update(key, section, true, this.isEntering);
            if (this.generated) {
                this.noti.warn(`You're editing the generated schedule!`, 3);
            } else {
                this.saveStatus();
            }
        },
        /**
         * if parsed is true, also update the pagination
         * @param {number} idx
         * @param {boolean} [parsed]
         */
        switchPage(idx, parsed = false) {
            if (0 <= idx && idx < Math.min(this.scheduleEvaluator.size(), this.maxNumSchedules)) {
                this.currentScheduleIndex = idx;
                if (parsed) {
                    this.tempScheduleIndex = idx;
                } else {
                    this.tempScheduleIndex = null;
                }
                this.currentSchedule = this.scheduleEvaluator.getSchedule(idx);
                this.saveStatus();
            }
        },
        /**
         * @param {string} query
         */
        getClass(query) {
            if (query === null || query.length === 0) {
                this.isEntering = false;
                this.inputCourses = null;
                return;
            }
            // if current schedule is displayed, switch to proposed schedule
            if (this.generated) {
                this.generated = !this.generated;
                this.currentSchedule = this.proposedSchedule;
            }
            this.inputCourses = this.catalog.search(query);
            this.isEntering = true;
        },
        /**
         * Select a semester and fetch all its associated data.
         *
         * This method will assign a correct Catalog object to `this.catalog` and `Schedule.catalog`
         * which will be either requested from remote or parsed from `localStorage`
         *
         * After that, schedules and settings will be parsed from `localStorage`
         * and assigned to relevant fields of `this`.
         * If no local data is present, then default values will be assigned.
         * @param {number} semesterId
         * @param {Object<string, any>} parsed_data
         */
        selectSemester(semesterId, parsed_data) {
            this.loading = true;
            this.currentSemester = this.semesters[semesterId];
            const data = localStorage.getItem(this.currentSemester.id);
            const allRecords_raw = localStorage.getItem(`${this.currentSemester.id}data`);
            const defaultCallback = () => {
                this.generated = false;
                this.scheduleEvaluator.clear();
                const defaultData = getDefaultData();
                for (const field of this.storageFields) {
                    if (field !== 'currentSemester') this[field] = defaultData[field];
                }
                this.saveAllRecords();
                this.saveStatus();
                this.loading = false;
            };
            if (!parsed_data && !data) {
                // set to default values
                this.fetchSemesterData(semesterId, defaultCallback);
                return;
            }
            const raw_data = parsed_data === undefined ? JSON.parse(data) : parsed_data;
            const storageVersion = raw_data.storageVersion;

            // storage version mismatch implies API update: use dafault data instead
            if (storageVersion !== this.storageVersion) {
                // clear local storage
                localStorage.clear();
                this.fetchSemesterData(semesterId, defaultCallback);
                return;
            }
            const temp = Catalog.fromJSON(
                JSON.parse(allRecords_raw, this.semesterDataExpirationTime)
            );

            // things to do after allRecord is loaded
            const callback = () => {
                this.generated = false;
                this.scheduleEvaluator.clear();
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
                if (temp.expired) {
                    // in this case, we only need to update catalog. Save a set of fresh data
                    this.fetchSemesterData(
                        semesterId,
                        () => {
                            this.saveAllRecords();
                            callback();
                        },
                        () => {
                            // if failed, just use the old data.
                            this.catalog = temp.catalog;
                            Schedule.catalog = temp.catalog;
                            callback();
                        }
                    );
                } else {
                    this.catalog = temp.catalog;
                    Schedule.catalog = temp.catalog;
                    callback();
                }
            }
        },
        saveAllRecords() {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key.endsWith('data')) {
                    localStorage.removeItem(key);
                }
            }
            localStorage.setItem(
                `${this.currentSemester.id}data`,
                JSON.stringify(this.catalog.toJSON())
            );
        },
        /**
         * fetch basic class data for the given semester for fast class search and rendering
         * this method will assign `this.catalog` and `Schedule.catalog`
         * @param {number} semeseterIdx
         * @param {()=>void} [callback]
         * @param {()=>void} [reject]
         */
        fetchSemesterData(semesterIdx, callback, reject) {
            // axios.get(`${this.api}/classes?semester=${semesterIdx}`).then(res => {
            //     this.catalog = new Catalog(this.currentSemester, res.data.data);
            //     // important: assign all records
            //     Schedule.catalog = this.catalog;
            //     if (typeof callback === 'function') {
            //         callback();
            //     }
            // });
            this.loading = true;
            timeout(getSemesterData(this.semesters[semesterIdx].id), 10000)
                .then(data => {
                    this.catalog = new Catalog(this.currentSemester, data);
                    // important: assign all records
                    Schedule.catalog = this.catalog;
                    if (typeof callback === 'function') {
                        callback();
                        this.loading = false;
                    }
                })
                .catch(err => {
                    let errStr = `Failed to fetch ${this.semesters[semesterIdx].name}: `;
                    console.warn(err);
                    if (typeof err === 'string') errStr += err;
                    else if (err.response) errStr += `request rejected by the server. `;
                    else if (err.request) errStr += `No response received. `;
                    if (typeof reject === 'function') {
                        errStr += 'Old data is used instead';
                        this.noti.warn(errStr);
                        reject();
                        this.loading = false;
                        return;
                    }
                    this.noti.error(errStr);
                    this.loading = false;
                });
        },
        closeClassList(event) {
            event.target.value = '';
            this.getClass(null);
        },
        generateSchedules(parsed = false) {
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
            if (this.generated) {
                this.currentSchedule = this.proposedSchedule;
            }
            this.loading = true;
            const generator = new ScheduleGenerator(this.catalog);

            generator
                .getSchedules(this.currentSchedule, {
                    timeSlots: timeFilters,
                    status: constraintStatus,
                    sortOptions: this.sortOptions
                })
                .then(evaluator => {
                    this.scheduleEvaluator = evaluator;
                    this.proposedSchedule = this.currentSchedule;
                    this.generated = true;
                    // this.currentSchedule = this.scheduleEvaluator.getSchedule(0);
                    this.switchPage(
                        this.currentScheduleIndex >= this.scheduleEvaluator.size()
                            ? 0
                            : this.currentScheduleIndex,
                        parsed
                    );
                    this.saveStatus();
                    this.noti.success(`${this.scheduleEvaluator.size()} Schedules Generated!`, 3);
                    this.loading = false;
                })
                .catch(err => {
                    console.warn(err);
                    this.generated = false;
                    this.scheduleEvaluator.clear();
                    this.noti.error(err);
                    this.saveStatus();
                    this.loading = false;
                });
        },
        /**
         * @param {number} optIdx
         */
        changeSorting(optIdx) {
            if (!Object.values(this.sortOptions.sortBy).some(x => x.enabled)) {
                // if (optIdx !== undefined) {
                //     this.sortOptions.sortBy[optIdx].enabled = true;
                // }
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
            if (!this.scheduleEvaluator.empty()) {
                this.loading = true;
                this.scheduleEvaluator.changeSort(this.sortOptions, true);
                if (!this.generated) {
                    this.proposedSchedule = this.currentSchedule;
                    this.currentSchedule = this.scheduleEvaluator.getSchedule(
                        this.currentScheduleIndex
                    );
                    this.generated = true;
                } else {
                    this.currentSchedule = this.scheduleEvaluator.getSchedule(
                        this.currentScheduleIndex
                    );
                }
                this.loading = false;
            }
        },
        saveStatus() {
            const obj = {};
            for (const field of this.storageFields) {
                // use toJSON method if it exists
                if (this[field] instanceof Object && typeof this[field].toJSON === 'function')
                    obj[field] = this[field].toJSON();
                else obj[field] = this[field];
            }
            localStorage.setItem(this.currentSemester.id, JSON.stringify(obj));
        },
        /**
         * @param {Object<string, any>} raw_data
         */
        parseLocalData(raw_data) {
            const defaultData = getDefaultData();
            for (const field of this.storageFields) {
                if (this[field] instanceof Object) {
                    if (typeof this[field].fromJSON === 'function') {
                        const parsed = this[field].fromJSON(raw_data[field]);
                        if (parsed) this[field] = parsed;
                        else this[field] = defaultData[field];
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
                } else if (typeof raw_data[field] === typeof this[field])
                    this[field] = raw_data[field];
                else this[field] = defaultData[field];
            }
            if (!this.proposedSchedule.empty()) {
                this.currentSchedule = this.proposedSchedule;
                this.generateSchedules(true);
            }
        },
        removeTimeSlot(n) {
            this.timeSlots.splice(n, 1);
        },
        addTimeSlot() {
            this.timeSlots.push(['', '']);
        },
        /**
         * Preprocess the time filters so that they are of the correct format
         * returns null on parsing error
         * @returns {[number, number][]}
         */
        computeFilter() {
            const timeSlotsRecord = [];
            for (const time of this.timeSlots) {
                const startTime = time[0].split(':');
                const endTime = time[1].split(':');
                if (
                    isNaN(startTime[0]) ||
                    isNaN(startTime[1]) ||
                    isNaN(endTime[0]) ||
                    isNaN(endTime[1])
                ) {
                    this.noti.error('Invalid time input.');
                    return null;
                }
                // note: substract/add one to allow end points
                const startMin = parseInt(startTime[0]) * 60 + parseInt(startTime[1]) + 1;
                const endMin = parseInt(endTime[0]) * 60 + parseInt(endTime[1]) - 1;
                if (startMin >= endMin) {
                    this.noti.error('Start time must be earlier than the end time');
                    return null;
                }
                timeSlotsRecord.push([startMin, endMin]);
            }
            return timeSlotsRecord;
        },
        onUploadJson(event) {
            const input = event.target;
            const reader = new FileReader();
            try {
                reader.onload = () => {
                    localStorage.setItem(this.currentSemester.id, reader.result);
                    const raw_data = JSON.parse(reader.result);
                    const semester = raw_data.currentSemester;
                    for (let i = 0; i < this.semesters.length; i++) {
                        if (this.semesters[i].id === semester.id) {
                            this.selectSemester(i, raw_data);
                            break;
                        }
                    }
                };
                reader.readAsText(input.files[0]);
            } catch (error) {
                this.noti.error(error);
            }
        },
        saveToJson() {
            const json = localStorage.getItem(this.currentSemester.id);
            const blob = new Blob([json], { type: 'text/json' });
            let url = window.URL.createObjectURL(blob);
            this.downloadURL = url;
            url = url.substring(5);
            console.log(this.currentSemester.id);
            // console.log(this.currentSchedule);
            window.URL.revokeObjectURL(url);
        }
    }
});
</script>

<style scoped>
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

.list-group-item {
    background-color: #f8f8f8;
}

.filter-add:hover {
    background-color: rgba(223, 223, 223, 0.5);
}

.sort-option {
    cursor: pointer;
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
</style>
