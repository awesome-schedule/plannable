<template>
    <div id="app" style="width:100%">
        <modal id="modal" :course="modalCourse"></modal>
        <ClassListModal
            v-if="classListModalCourse !== null"
            id="class-list-modal"
            :course="classListModalCourse"
        ></ClassListModal>
        <!-- navigation bar -->
        <nav
            class="navbar navbar-expand-lg navbar-light"
            style="background-color:#F9A348;position:fixed;width:100%;z-index:5"
        >
            <!-- brand -->
            <a class="navbar-brand text-white">UVaAutoScheduler</a>

            <button
                class="navbar-toggler"
                type="button"
                data-toggle="collapse"
                data-target="#navbarSupportedContent"
                aria-controls="navbarSupportedContent"
                aria-expanded="true"
                aria-label="Toggle navigation"
            >
                <span class="navbar-toggler-icon"></span>
            </button>

            <div id="navbarSupportedContent" class="collapse navbar-collapse">
                <ul class="navbar-nav mr-auto">
                    <!-- first item -->
                    <li class="nav-item">
                        <a class="nav-link text-light" href="/about" aria-disabled="true">
                            About
                            <span class="sr-only">(current)</span>
                        </a>
                    </li>
                </ul>
            </div>
        </nav>
        <!-- end of navigation bar -->
        <transition name="fade">
            <div
                v-if="errMsg.length > 0"
                class="alert alert-danger"
                role="alert"
                style="width:94%;margin-left:3%"
            >
                {{ errMsg }}
                <button
                    type="button"
                    class="close"
                    aria-label="Close"
                    style="align:center"
                    role="button"
                    @click="errMsg = ''"
                >
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
        </transition>

        <table style="width:97%;margin:auto auto">
            <tr>
                <td style="width:3%; vertical-align:top;">
                    <br /><br /><br />
                    <div style="position:fixed;background-color:#00c0ff;width:3rem">
                        <span
                            class="side-button"
                            style="font-size:2rem;margin-left:20%; display:block;"
                            @click="
                                showSelectClass = !showSelectClass;
                                showFilter = false;
                                showSetting = false;
                            "
                        >
                            <i class="far fa-calendar-alt"></i>
                        </span>
                        <br />
                        <span
                            class="side-button mt-2"
                            style="font-size:1.7rem;margin-left:20%; display:block;"
                            @click="
                                showFilter = !showFilter;
                                showSelectClass = false;
                                showSetting = false;
                            "
                        >
                            <i class="fas fa-filter"></i>
                        </span>
                        <br />
                        <span
                            style="font-size:1.8rem;margin-left:20%; display:block;"
                            class="side-button mt-2"
                            @click="
                                showSetting = !showSetting;
                                showSelectClass = false;
                                showFilter = false;
                            "
                        >
                            <i class="fas fa-cog"></i>
                        </span>
                    </div>
                </td>
                <td v-if="sideBar && showSelectClass" id="leftBar" class="leftside">
                    <!-- term selection dropdown -->
                    <div class="dropdown" style="margin-top:70px">
                        <button
                            id="semester"
                            class="btn btn-primary mt-4 mx-auto"
                            style="width: 100%; margin-top: 0 !important"
                            type="button"
                            data-toggle="dropdown"
                        >
                            {{
                                currentSemester === null ? 'Select Semester' : currentSemester.name
                            }}
                        </button>
                        <div
                            class="dropdown-menu"
                            aria-labelledby="dropdownMenuButton"
                            style="width: 100%;"
                        >
                            <a
                                v-for="(semester, index) in semesters"
                                :key="semester.id"
                                class="dropdown-item"
                                style="width: 100%;"
                                href="#"
                                @click="selectSemester(index)"
                                >{{ semester.name }}</a
                            >
                        </div>
                    </div>
                    <!--input title-->
                    <div ref="enteringCardTop" class="input-group mt-2">
                        <input
                            type="text"
                            class="form-control"
                            placeholder="Course Title"
                            style="font-size: 10pt"
                            aria-describedby="basic-addon1"
                            @input="getClass($event.target.value)"
                            @keyup.esc="closeClassList($event)"
                        />
                    </div>
                    <div v-if="!isEntering">
                        <div ref="staticCardTop" class="mt-3">
                            <button
                                class="btn btn-primary"
                                type="button"
                                data-toggle="collapse"
                                data-target="#currentSelectedClass"
                                aria-expanded="true"
                                aria-controls="currentSelectedClass"
                                style="width:100%"
                            >
                                Current Selected Classes
                            </button>
                        </div>
                        <div id="currentSelectedClass" class="collapse show">
                            <div
                                class="card card-body"
                                style="padding:5px; overflow-y: auto;"
                                :style="`max-height:${staticCardHeight}px`"
                            >
                                <ClassList
                                    :courses="currentCourses"
                                    :schedule="currentSchedule"
                                    :is-entering="isEntering"
                                    @update_course="updateCourse"
                                    @remove_course="removeCourse"
                                    @remove_preview="removePreview"
                                    @trigger-classlist-modal="showClassListModal"
                                    @preview="preview"
                                ></ClassList>
                                <div>
                                    <!-- <button class="btn btn-primary mt-3" v-on:click="cleanSchedules">Clean Schedule</button>&nbsp;&nbsp; -->
                                    <button
                                        type="button"
                                        class="btn btn-success mt-2"
                                        @click="generateSchedules"
                                    >
                                        Submit
                                    </button>
                                    <button class="btn btn-warning mt-2 ml-1" @click="clear">
                                        Clean All
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div
                        v-if="isEntering"
                        ref="classList"
                        class="card card-body"
                        style="padding:5px; overflow-y: auto;"
                        :style="`max-height:${enteringCardHeight}px`"
                    >
                        <ClassList
                            :courses="inputCourses"
                            :schedule="currentSchedule"
                            :is-entering="isEntering"
                            @update_course="updateCourse"
                            @remove_preview="removePreview"
                            @preview="preview"
                            @close="closeClassList"
                            @trigger-classlist-modal="showClassListModal"
                        ></ClassList>
                    </div>
                </td>

                <td
                    v-if="sideBar && showFilter"
                    class="leftside"
                    style="width: 20%; vertical-align:top; padding-left:2%;position:fixed"
                >
                    <div style="margin-top:70px">
                        <button
                            class="btn btn-primary"
                            type="button"
                            data-toggle="collapse"
                            data-target="#filter"
                            aria-expanded="true"
                            aria-controls="filter"
                            style="width:100%;"
                        >
                            Filters
                        </button>
                    </div>

                    <div id="filter" class="collapse show">
                        <div class="card card-body" style="padding:3%">
                            <div class="filter mt-2">
                                <ul class="list-group list-group-flush" style="width:100%">
                                    <li
                                        v-for="n in timeSlots"
                                        :key="n"
                                        class="list-group-item"
                                        style="padding:2%"
                                    >
                                        <input
                                            type="time"
                                            min="8:00"
                                            max="22:00"
                                            style="-webkit-appearance:button"
                                        />
                                        -
                                        <input
                                            type="time"
                                            min="8:00"
                                            max="22:00"
                                            style="-webkit-appearance:button"
                                        />
                                        <button
                                            type="button"
                                            class="close"
                                            aria-label="Close"
                                            role="button"
                                        >
                                            <span
                                                aria-hidden="true"
                                                @click="removeATimeConstraint(n)"
                                                >&times;</span
                                            >
                                        </button>
                                    </li>

                                    <li class="list-group-item" style="text-align:center">
                                        <button
                                            type="button"
                                            class="close"
                                            aria-label="Close"
                                            role="button"
                                        >
                                            <span
                                                aria-hidden="true"
                                                @click="
                                                    timeSlots.push(numberOfTimeSlots);
                                                    numberOfTimeSlots += 1;
                                                "
                                                >+</span
                                            >
                                        </button>
                                    </li>
                                </ul>

                                <div style="padding:10%">
                                    <label for="awt">Wait List</label>&nbsp;&nbsp;
                                    <input
                                        id="awt"
                                        v-model="allowWaitlist"
                                        type="checkbox"
                                        checked
                                    />&nbsp;&nbsp; <br /><label for="ac">Closed</label>&nbsp;&nbsp;
                                    <input id="ac" v-model="allowClosed" type="checkbox" checked />
                                </div>
                            </div>
                            <!--submit button-->
                            <button
                                type="button"
                                class="btn btn-outline-success mt-2"
                                @click="sendRequest"
                            >
                                Submit
                            </button>
                        </div>
                    </div>
                </td>

                <td v-if="sideBar && showSetting" class="leftside">
                    <button
                        type="button"
                        style="margin-top:70px;width:100%"
                        class="btn btn-primary mb-3"
                    >
                        Schedule Display Settings
                    </button>

                    <div class="input-group mb-3">
                        <div class="input-group-prepend">
                            <span class="input-group-text">Class Block</span>
                        </div>
                        <input
                            v-model="fullHeight"
                            type="number"
                            class="form-control"
                            @input="saveStatus()"
                        />
                        <div class="input-group-append">
                            <span class="input-group-text">px</span>
                        </div>
                    </div>

                    <div class="input-group mb-3">
                        <div class="input-group-prepend">
                            <span class="input-group-text">Placeholder</span>
                        </div>
                        <input
                            v-model="partialHeight"
                            type="number"
                            class="form-control"
                            @input="saveStatus()"
                        />
                        <div class="input-group-append">
                            <span class="input-group-text">px</span>
                        </div>
                    </div>

                    <div>
                        Display Options:
                        <div>
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
                        </div>
                    </div>
                </td>

                <td style="width:75%;vertical-align: top;text-align-left">
                    <table style="width:100%;margin-top:60px">
                        <tr>
                            <td>
                                <button
                                    v-if="isEntering"
                                    class="btn btn-primary mt-1"
                                    style="font-size:10px"
                                    @click="closeClassList"
                                >
                                    Hide Class List
                                </button>
                            </td>
                            <td>
                                <Pagination
                                    v-if="schedules !== null && schedules.length > 0"
                                    :indices="scheduleIndices"
                                    @switch_page="switchPage"
                                ></Pagination>
                            </td>
                        </tr>
                    </table>

                    <div class="tab mt-2"></div>
                    <grid-schedule
                        :courses="currentSchedule"
                        style="width:100%"
                        :show-time="showTime"
                        :show-room="showRoom"
                        :show-instructor="showInstructor"
                        :full-height="+fullHeight"
                        :partial-height="+partialHeight"
                        @trigger-modal="showModal"
                    ></grid-schedule>
                </td>
            </tr>
        </table>
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
import axios from 'axios';
import { ScheduleGenerator } from './algorithm/ScheduleGenerator.js';

/**
 * @typedef {{id: string, name: string}} Semester
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
             * @type {AllRecords}
             */
            allRecords: null,
            /**
             * @type {Schedule}
             */
            currentSchedule: new Schedule(),
            /**
             * @type {Course[]}
             */
            currentCourses: [],
            /**
             * @type {import('./models/Schedule').RawSchedule[]}
             */
            schedules: null,
            isEntering: false,
            sideBar: true,
            showSelectClass: true,
            showFilter: false,
            showSetting: false,
            /**
             * @type {Course[]}
             */
            inputCourses: null,
            startTime: '',
            endTime: '',
            allTimes: [],
            errMsg: '',
            allowWaitlist: true,
            allowClosed: true,
            cache: true,
            /**
             * @type {Course}
             */
            modalCourse: null,
            /**
             * A course record to be displayed on Modal
             * @type {CourseRecord}
             */
            classListModalCourse: null,
            showTime: true,
            showRoom: true,
            showInstructor: true,
            fullHeight: 50,
            partialHeight: 20,
            timeSlots: [],
            numberOfTimeSlots: 0,
            staticCardHeight: 500,
            enteringCardHeight: 500
        };
    },
    computed: {
        /**
         * @return {number[]}
         */
        scheduleIndices() {
            const indices = new Array(this.schedules.length);
            for (let i = 0; i < indices.length; i++) indices[i] = i;
            return indices;
        }
    },
    mounted() {
        axios.get(`${this.api}/semesters`).then(res => {
            this.semesters = res.data;
            // get the latest semester
            this.selectSemester(this.semesters.length - 1);
        });

        this.staticCardHeight =
            document.documentElement.clientHeight -
            this.$refs.staticCardTop.getBoundingClientRect().bottom -
            10;

        this.enteringCardHeight =
            document.documentElement.clientHeight -
            this.$refs.enteringCardTop.getBoundingClientRect().bottom -
            10;

        // generate a series of time
        let f = false;
        for (let i = 7; i < 21; ) {
            const time = (i % 12) + 1;
            if (f) {
                i++;
                this.allTimes.push(time + ':30' + (i >= 12 ? 'PM' : 'AM'));
            } else {
                this.allTimes.push(time + ':00' + (i >= 12 ? 'PM' : 'AM'));
            }
            f = !f;
        }
    },
    methods: {
        getCurrentCourses() {
            const courses = [];
            for (const key in this.currentSchedule.All)
                courses.push(this.allRecords.getRecord(key));
            return courses;
        },
        clear() {
            this.currentSchedule.clean();
            this.currentCourses = [];
            this.schedules = [];
            this.saveStatus();
        },
        cleanSchedules() {
            this.schedules = [];
            this.currentSchedule.cleanSchedule();
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
            this.currentCourses = this.getCurrentCourses();
            this.saveStatus();
        },
        /**
         * @param {string} key
         * @param {number} section
         */
        updateCourse(key, section) {
            this.currentSchedule.update(key, section);
            this.currentCourses = this.getCurrentCourses();
            this.saveStatus();
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
            if (0 <= idx && idx < this.schedules.length) {
                this.currentSchedule = new Schedule(this.schedules[idx], 'Schedule', idx + 1);
                this.currentCourses = this.getCurrentCourses();
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
            this.inputCourses = this.allRecords.search(query);
            this.isEntering = true;
        },
        /**
         * @param {number} semesterId
         */
        selectSemester(semesterId) {
            this.currentSemester = this.semesters[semesterId];

            // fetch basic class data for the given semester for fast class search
            axios.get(`${this.api}/classes?semester=${semesterId}`).then(res => {
                this.allRecords = new AllRecords(res.data.data);

                // important: assign all records
                Schedule.allRecords = this.allRecords;
                if (this.cache) this.loadStatus();
                else this.currentSchedule = new Schedule([], 'Schedule', 1);
            });
        },
        closeClassList(event) {
            event.target.value = '';
            this.getClass(null);
            this.currentCourses = this.getCurrentCourses();
            this.$forceUpdate();
        },
        generateSchedules() {
            const constraintStatus = [];
            if (!this.allowWaitlist) {
                constraintStatus.push('Wait List');
            }
            if (!this.allowClosed) {
                constraintStatus.push('Closed');
            }
            const generator = new ScheduleGenerator(this.allRecords);
            const table = generator.getSchedules(this.currentSchedule, {
                timeSlots: [],
                status: constraintStatus
            });
            const heap = table.finalTable;
            const raw_data = heap.top(10);

            /**
             * @type {[string, number, number][]}
             */
            const translated_raw = [];
            for (const rd of raw_data) {
                const raw_schedule = [];
                for (const raw_course of rd.schedule) {
                    raw_schedule.push([raw_course[0], raw_course[3], -1]);
                }
                translated_raw.push(raw_schedule);
            }
            this.schedules = translated_raw;
            this.currentSchedule = new Schedule(this.schedules[0]);
            this.currentCourses = this.getCurrentCourses();
            this.saveStatus();
        },
        sendRequest() {
            // if (this.currentSchedule.All.length < 2) return;
            const days = [];
            if (this.allTimes.includes(this.startTime)) {
                days.push(`MoTuWeThFr 00:00AM - ${this.startTime}`);
            }
            if (this.allTimes.includes(this.endTime)) {
                days.push(`MoTuWeThFr ${this.endTime} - 10:00PM`);
            }
            const request = {
                classes: [],
                semester: this.currentSemester,
                num: 10
            };
            if (days.length > 0) request.filter = { days };

            for (const key in this.currentSchedule.All) {
                request.classes.push(key);
            }
            axios.post(`${this.api}/classes`, request).then(res => {
                if (res.data.status.err.length > 0) {
                    this.errMsg = res.data.status.err;
                    this.schedules = [];
                    return;
                }
                if (res.data.data.length === 0) {
                    this.errMsg = 'No matching schedule satisfying the given constraints';
                    this.schedules = [];
                    return;
                }
                this.parseResponse(res);
            });
        },
        saveStatus() {
            console.log(this.showTime);
            localStorage.setItem(
                this.currentSemester.id,
                JSON.stringify({
                    schedules: this.schedules,
                    currentSchedule: this.currentSchedule.toJSON(),
                    startTime: this.startTime,
                    endTime: this.endTime,
                    fullHeight: this.fullHeight,
                    partialHeight: this.partialHeight
                })
            );
        },
        loadStatus() {
            const data = localStorage.getItem(this.currentSemester.id);
            if (data === null || data.length === 0) return;
            const raw_data = JSON.parse(data);
            if (
                raw_data !== null &&
                raw_data.schedules !== undefined &&
                raw_data.currentSchedule !== undefined
            ) {
                this.schedules = raw_data.schedules;
                this.currentSchedule = Schedule.fromJSON(raw_data.currentSchedule);
                this.currentCourses = this.getCurrentCourses();
                this.startTime = raw_data.startTime;
                this.endTime = raw_data.endTime;

                this.fullHeight = isNaN(raw_data.fullHeight) ? 50 : parseInt(raw_data.fullHeight);
                this.partialHeight = isNaN(raw_data.partialHeight)
                    ? 20
                    : parseInt(raw_data.partialHeight);
            }
        },
        removeATimeConstraint(n) {
            this.timeSlots.splice(this.timeSlots.indexOf(n), 1);
            this.numberOfTimeSlots -= 1;
        }
    }
});
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.5s;
}
.fade-enter, .fade-leave-to /* .fade-leave-active below version 2.1.8 */ {
    opacity: 0;
}
.side-button {
    color: #5e5e5e;
}
.side-button:hover {
    color: #3e3e3e;
}
.side-button:active {
    color: #bbbbbb;
}

.leftside {
    width: 20%;
    padding-left: 2%;
    vertical-align: top;
    padding-top: 0;
    position: fixed;
}
</style>
