<template>
    <div id="app" style="width:100%" @change="onDocChange">
        <modal id="modal" :course="modalCourse"></modal>
        <ClassListModal
            v-if="classListModalCourse !== null"
            id="class-list-modal"
            :course="classListModalCourse"
        ></ClassListModal>
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
                    class="btn btn-primary nav-btn mt-0"
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
                        v-for="(semester, index) in semesters.slice().reverse()"
                        :key="semester.id"
                        class="dropdown-item"
                        style="width: 100%;"
                        href="#"
                        @click="selectSemester(semesters.length - index - 1)"
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
                    @remove_preview="removePreview"
                    @preview="preview"
                    @close="closeClassList"
                    @trigger-classlist-modal="showClassListModal"
                ></ClassList>
            </div>
            <div>
                <div class="mt-3">
                    <button
                        class="btn btn-primary nav-btn"
                        @click="
                            if (!scheduleEvaluator.empty()) {
                                if (generated) {
                                    currentSchedule = proposedSchedule;
                                } else switchPage(currentScheduleIndex);
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
                        @remove_preview="removePreview"
                        @trigger-classlist-modal="showClassListModal"
                        @preview="preview"
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
            <ul class="list-group list-group-flush" style="width:99%">
                <button class="btn btn-primary nav-btn mt-3">
                    Semester Data
                </button>
                <li class="list-group-item">Total Credits: {{ totalCredit }}</li>
                <li class="list-group-item"></li>
            </ul>
        </nav>

        <nav v-if="sideBar && showFilter" class="d-block bg-light sidebar">
            <button class="btn btn-primary nav-btn">
                Filters
            </button>
            <ul class="list-group list-group-flush mx-1">
                <li class="list-group-item" title="Time periods when you don't want to have class">
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
                <li class="list-group-item">Sort According to</li>
                <li class="list-group-item">
                    <ul class="list-group list-group-flush mx-1">
                        <div class="custom-control custom-radio">
                            <input
                                id="compactness"
                                v-model="sortBy"
                                type="radio"
                                class="custom-control-input"
                                value="compactness"
                                @click="changeSorting('compactness')"
                            />
                            <label class="custom-control-label" for="compactness">
                                Compactness
                            </label>
                        </div>
                        <div class="custom-control custom-radio">
                            <input
                                id="variance"
                                v-model="sortBy"
                                type="radio"
                                class="custom-control-input"
                                value="variance"
                                @click="changeSorting('variance')"
                            />
                            <label class="custom-control-label" for="variance">
                                Variance
                            </label>
                        </div>
                    </ul>
                </li>
            </ul>
        </nav>

        <nav v-if="sideBar && showSetting" class="d-block bg-light sidebar">
            <button class="btn btn-primary nav-btn">
                Schedule Display settings
            </button>
            <div class="list-group list-group-flush mx-1">
                <div class="input-group my-3" title="height of a course on schedule">
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
            <button class="btn btn-primary nav-btn">
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
                <li class="list-group-item">
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
                <li class="list-group-item">
                    <button class="btn btn-outline-danger" style="width: 100%" @click="clearCache">
                        Reset All and Clean
                    </button>
                </li>
                <li class="list-group-item"></li>
            </ul>
        </nav>

        <nav v-if="sideBar && showExport" class="d-block bg-light sidebar">
            <button class="btn btn-primary nav-btn">
                Import/Export Schedule
            </button>
            <ul class="list-group list-group-flush mx-1">
                <li class="list-group-item">
                    <div class="custom-file">
                        <input
                            id="customFile"
                            type="file"
                            class="custom-file-input"
                            accept="text/json"
                            style="width:100%"
                            @change="onUploadJson($event)"
                        />
                        <label class="custom-file-label" for="customFile">Choose file</label>
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
                <li class="list-group-item"></li>
            </ul>
        </nav>

        <transition name="fade">
            <div
                v-if="noti.msg.length > 0"
                class="alert mt-1 mb-0"
                :class="`alert-${noti.class}`"
                role="alert"
                :style="`width:${scheduleWidth}vw; margin-left:${scheduleLeft}vw;`"
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
                    mobile ? (scrollable ? 200 : 90) + '%' : scheduleWidth + 'vw'
                }; margin-left:${mobile ? 11 : scheduleLeft}vw;`
            "
        >
            <div class="container-fluid mb-2">
                <div class="row justify-content-center">
                    <div class="col">
                        <Pagination
                            v-if="generated && !scheduleEvaluator.empty()"
                            :indices="scheduleIndices"
                            @switch_page="switchPage"
                        ></Pagination>
                    </div>
                </div>
            </div>
            <grid-schedule
                :courses="currentSchedule"
                :show-time="showTime"
                :show-room="showRoom"
                :show-instructor="showInstructor"
                :full-height="+fullHeight"
                :partial-height="+partialHeight"
                @trigger-modal="showModal"
            ></grid-schedule>
        </div>
    </div>
</template>

<script>
// eslint-disable-next-line
/* global $ */
import Vue from 'vue';
import ClassList from './components/ClassList.vue';
import Pagination from './components/Pagination.vue';
import GridSchedule from './components/GridSchedule.vue';
import Modal from './components/Modal.vue';
import ClassListModal from './components/ClassListModal.vue';
// eslint-disable-next-line
import CourseRecord from './models/CourseRecord.js';
import Schedule from './models/Schedule.js';
// eslint-disable-next-line
import Course from './models/Course.js';
import AllRecords from './models/AllRecords.js';
// import axios from 'axios';
import ScheduleGenerator from './algorithm/ScheduleGenerator.js';
import ScheduleEvaluator from './algorithm/ScheduleEvaluator.js';
import { getSemesterList, getSemesterData } from './data/DataLoader.js';
import Notification from './models/Notification.js';

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
        ClassListModal
    },
    data() {
        const defaultData = {
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
             * @type {AllRecords}
             */
            allRecords: null,
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
            scheduleEvaluator: new ScheduleEvaluator('variance'),
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
            fullHeight: 45,
            partialHeight: 35,
            /**
             * @type {[string, string][]}
             */
            timeSlots: [],
            allowWaitlist: true,
            allowClosed: true,
            sortBy: 'variance',

            downloadURL: '',

            // storage related fields
            storageVersion: 2,
            storageFields: [
                // schedules
                'currentSemester',
                'currentSchedule',
                'proposedSchedule',
                'sortBy',
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
                'storageVersion'
            ],

            // other
            noti: new Notification(),
            cache: true,
            navHeight: 500,
            loading: false,
            mobile: window.screen.width < 900,
            scrollable: false
        };
        defaultData.defaultData = defaultData;
        return defaultData;
    },
    computed: {
        /**
         * @return {number[]}
         */
        scheduleIndices() {
            const indices = new Array(
                Math.min(this.scheduleEvaluator.size(), this.maxNumSchedules)
            );
            for (let i = 0; i < indices.length; i++) indices[i] = i;
            return indices;
        },
        scheduleWidth() {
            return this.sideBar &&
                (this.showSelectClass || this.showFilter || this.showSetting || this.showExport)
                ? 100 - 19 - 3 - 5
                : 100 - 3 - 3;
        },
        scheduleLeft() {
            return this.sideBar &&
                (this.showSelectClass || this.showFilter || this.showSetting || this.showExport)
                ? 23
                : 3;
        },
        totalCredit() {
            return this.currentSchedule.totalCredit;
        }
    },
    watch: {},
    created() {
        // axios.get(`${this.api}/semesters`).then(res => {
        //     this.semesters = res.data;
        //     // get the latest semester
        //     this.selectSemester(this.semesters.length - 1);
        // });
        this.loading = true;
        getSemesterList()
            .then(res => {
                this.semesters = res;
                // get the latest semester
                this.selectSemester(this.semesters.length - 1);
                this.loading = false;
            })
            .catch(error => {
                this.noti.error(error);
                this.loading = false;
            });

        this.navHeight = document.documentElement.clientHeight;
    },

    methods: {
        onDocChange() {
            this.saveStatus();
        },
        clear() {
            this.currentSchedule.clean();
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
         * @param {string} key
         * @param {number} section
         */
        preview(key, section) {
            this.currentSchedule.preview(key, section);
        },
        removePreview() {
            this.currentSchedule.removePreview();
        },
        /**
         * @param {number} idx
         */
        switchPage(idx) {
            if (0 <= idx && idx < Math.min(this.scheduleEvaluator.size(), this.maxNumSchedules)) {
                this.currentScheduleIndex = idx;
                this.currentSchedule = this.scheduleEvaluator.getSchedule(idx);
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
            this.inputCourses = this.allRecords.search(query);
            this.isEntering = true;
        },
        /**
         * Select a semester and fetch all its associated data.
         *
         * This method will assign a correct AllRecords object to `this.allRecords` and `Schedule.allRecords`
         * which will be either requested from remote or parsed from `localStorage`
         *
         * After that, schedules and settings will be parsed from `localStorage` and assigned to relevant fields of `this`. If no local data is present, then default values will be assigned.
         * @param {number} semesterId
         * @param {Object<string, any>} parsed_data
         */
        selectSemester(semesterId, parsed_data = undefined) {
            this.currentSemester = this.semesters[semesterId];
            const data = localStorage.getItem(this.currentSemester.id);
            const allRecords_raw = localStorage.getItem(`${this.currentSemester.id}data`);
            const defaultCallback = () => {
                for (const field of this.storageFields) {
                    this[field] = this.defaultData[field];
                }
                this.saveAllRecords();
                this.saveStatus();
            };
            if (parsed_data === undefined && (data === null || data.length === 0)) {
                // set to default values
                this.fetchSemesterData(semesterId, defaultCallback);
                return;
            }
            const raw_data = parsed_data === undefined ? JSON.parse(data) : parsed_data;
            // must assign allRecords prior to any other fields
            const storageVersion = raw_data.storageVersion;

            // storage version mismatch implies API update: use dafault data instead
            if (storageVersion !== this.storageVersion) {
                // clear local storage
                localStorage.clear();
                this.fetchSemesterData(semesterId, defaultCallback);
                return;
            }
            const temp = AllRecords.fromJSON(JSON.parse(allRecords_raw));

            // things to do after allRecord is loaded
            const callback = () => {
                this.parseLocalData(raw_data);
            };
            // if data is non-existant or data expires
            if (temp === null) {
                // in this case, we only need to update allRecords. Save a set of fresh data
                this.fetchSemesterData(semesterId, () => {
                    callback();
                    this.saveAllRecords();
                });
            } else {
                this.allRecords = temp;
                Schedule.allRecords = temp;
                callback();
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
                JSON.stringify(this.allRecords.toJSON())
            );
        },
        /**
         * fetch basic class data for the given semester for fast class search and rendering
         * this method will assign `this.allRecords` and `Schedule.allRecords`
         * @param {number} semeseterIdx
         * @param {()=>void} callback
         */
        fetchSemesterData(semesterIdx, callback) {
            console.info(`Loading semester ${semesterIdx} data from remote...`);
            // axios.get(`${this.api}/classes?semester=${semesterIdx}`).then(res => {
            //     this.allRecords = new AllRecords(this.currentSemester, res.data.data);
            //     // important: assign all records
            //     Schedule.allRecords = this.allRecords;
            //     if (typeof callback === 'function') {
            //         callback();
            //     }
            // });
            this.loading = true;
            getSemesterData(this.semesters[semesterIdx].id)
                .then(data => {
                    this.allRecords = new AllRecords(this.currentSemester, data);
                    // important: assign all records
                    Schedule.allRecords = this.allRecords;
                    if (typeof callback === 'function') {
                        callback();
                        this.loading = false;
                    }
                })
                .catch(err => {
                    this.noti.error(err);
                    this.loading = false;
                });
        },
        closeClassList(event) {
            event.target.value = '';
            this.getClass(null);
        },
        generateSchedules() {
            const constraintStatus = [];
            if (!this.allowWaitlist) {
                constraintStatus.push('Wait List');
            }
            if (!this.allowClosed) {
                constraintStatus.push('Closed');
            }
            if (this.generated) {
                this.currentSchedule = this.proposedSchedule;
            }
            const generator = new ScheduleGenerator(this.allRecords);
            const timeFilters = this.computeFilter();

            // null means there's an error processing time filters. Don't continue if that's the case
            if (timeFilters === null) return;
            try {
                this.scheduleEvaluator = generator.getSchedules(this.currentSchedule, {
                    timeSlots: timeFilters,
                    status: constraintStatus,
                    sortBy: this.sortBy
                });

                if (this.scheduleEvaluator.empty())
                    throw 'No schedules can be generated: class time conflict';
                this.scheduleEvaluator.sort();
                this.proposedSchedule = this.currentSchedule;
                this.generated = true;
                this.currentSchedule = this.scheduleEvaluator.getSchedule(0);
                this.noti.success('Schedules Generated!', 3);
            } catch (error) {
                this.generated = false;
                this.scheduleEvaluator.clear();
                this.noti.error('No schedules satisfying the given filter can be found.');
                return;
            } finally {
                this.saveStatus();
            }
        },
        /**
         * @param {string} sortBy
         */
        changeSorting(sortBy) {
            if (!this.scheduleEvaluator.empty()) {
                this.scheduleEvaluator.changeSort(sortBy, true);
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
            }
        },
        saveStatus() {
            console.time('saved in');
            const obj = {};
            for (const field of this.storageFields) {
                // use toJSON method if it exists
                if (this[field] instanceof Object && typeof this[field].toJSON === 'function')
                    obj[field] = this[field].toJSON();
                else obj[field] = this[field];
            }
            localStorage.setItem(this.currentSemester.id, JSON.stringify(obj));
            console.timeEnd('saved in');
        },
        /**
         * @param {Object<string, any>} raw_data
         */
        parseLocalData(raw_data) {
            for (const field of this.storageFields) {
                if (this[field] instanceof Object && typeof this[field].fromJSON === 'function')
                    this[field] = this[field].fromJSON(raw_data[field]);
                else if (raw_data[field] !== undefined && raw_data[field] !== null)
                    this[field] = raw_data[field];
            }
            if (!this.proposedSchedule.empty()) {
                this.currentSchedule = this.proposedSchedule;
                this.generateSchedules();
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
                const startMin = parseInt(startTime[0]) * 60 + parseInt(startTime[1]);
                const endMin = parseInt(endTime[0]) * 60 + parseInt(endTime[1]);
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
                    const semester = raw_data['currentSemester'];
                    for (let i = 0; i < this.semesters.length; i++) {
                        if (this.semesters[i].id == semester.id) {
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
