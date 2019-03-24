<template>
    <div id="app" style="width:100%">
        <modal id="modal" :course="modalCourse"></modal>
        <ClassListModal
            v-if="classListModalCourse !== null"
            id="class-list-modal"
            :course="classListModalCourse"
        ></ClassListModal>

        <transition name="fade" style="width:100%">
            <div
                v-if="errMsg.length > 0"
                class="alert alert-danger"
                role="alert"
                style="width:94%;margin-left:3%;"
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

        <nav class="d-none d-md-block bg-light button-bar" style="width:3rem">
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
        </nav>

        <nav
            v-if="sideBar && showSelectClass"
            class="d-none d-md-block bg-light sidebar"
            style="left:3rem;width:15rem"
        >
            <div class="dropdown" style="">
                <button
                    id="semester"
                    class="btn btn-primary mt-4 mx-auto"
                    style="width: 100%; margin-top: 0 !important"
                    type="button"
                    data-toggle="dropdown"
                >
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
                    placeholder="Title/Number/Topic/Professor"
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
                        style="width:100%"
                        @click="
                            if (schedules !== null && schedules.length > 0) {
                                if (generated) currentSchedule = proposedSchedule;
                                else switchPage(currentScheduleIndex);
                                generated = !generated;
                            }
                        "
                    >
                        {{
                            generated
                                ? `Generated Schedule: ${currentScheduleIndex + 1}`
                                : 'Proposed Schedule'
                        }}
                    </button>
                </div>
                <div id="currentSelectedClass">
                    <div
                        class="card card-body p-1"
                        style="overflow-y: auto;"
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
                class="card card-body p-1"
                style="overflow-y: auto;"
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
        </nav>

        <nav
            v-if="sideBar && showFilter"
            class="d-none d-md-block bg-light sidebar"
            style="left:3rem;width:15rem"
        >
            <ul class="list-group list-group-flush" style="width:99%">
                <li class="list-group-item">Filters</li>
                <li
                    v-for="(value, n) in timeSlots"
                    v-if="value !== undefined"
                    :key="n"
                    class="list-group-item"
                    style="padding:2%"
                >
                    <!-- @input="timeSlots[n][0] = $event.target.value" -->
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
                    <button type="button" class="close" aria-label="Close" role="button">
                        <span aria-hidden="true" @click="removeATimeConstraint(n)">&times;</span>
                    </button>
                </li>
                <li class="list-group-item" @click="addTimeSlot">Add</li>
                <li class="list-group-item">
                    <div class="custom-control custom-checkbox mt-2">
                        <input
                            id="awt"
                            v-model="allowWaitlist"
                            type="checkbox"
                            class="custom-control-input"
                        />
                        <label class="custom-control-label" for="awt">Wait List</label>
                    </div>
                </li>
                <li class="list-group-item">
                    <div class="custom-control custom-checkbox mt-1">
                        <input
                            id="ac"
                            v-model="allowClosed"
                            type="checkbox"
                            class="custom-control-input"
                        />
                        <label class="custom-control-label" for="ac">Closed</label>
                    </div>
                </li>
                <li class="list-group-item" @click="addFilter">
                    Does nothing
                </li>
            </ul>
        </nav>

        <nav
            v-if="sideBar && showSetting"
            class="d-none d-md-block bg-light sidebar"
            style="left:3rem;width:15rem"
        >
            <div class="sidebar-sticky">
                <ul class="list-group list-group-flush" style="width:99%">
                    <li class="list-group-item">Schedule Display settings</li>
                    <!-- <li class="list-group-item p-0"> -->
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
                    <!-- </li> -->
                    <li class="list-group-item">Display Options</li>
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

                    <li class="list-group-item"></li>
                </ul>
            </div>
        </nav>

        <table :style="`width:${scheduleWidth}%; margin-left:${scheduleLeft}rem;`">
            <tr>
                <td style="width:75%;vertical-align: top;text-align-left">
                    <div class="container-fluid">
                        <div class="row justify-content-center">
                            <div style="float:left">
                                <button
                                    v-if="isEntering && showSelectClass"
                                    class="btn btn-primary mt-1"
                                    style="font-size:10px"
                                    @click="closeClassList"
                                >
                                    Hide Class List
                                </button>
                            </div>
                            <div class="col">
                                <Pagination
                                    v-if="generated && schedules !== null && schedules.length > 0"
                                    :indices="scheduleIndices"
                                    @switch_page="switchPage"
                                ></Pagination>
                            </div>
                            <!-- <div class="col col-1"></div> -->
                        </div>
                    </div>

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
/**
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
            currentScheduleIndex: 0,
            /**
             * @type {Schedule}
             */
            currentSchedule: new Schedule(),
            /**
             * @type {Schedule}
             */
            proposedSchedule: new Schedule(),
            generated: false,
            /**
             * @type {Course[]}
             */
            currentCourses: [],
            /**
             * @type {RawSchedule[]}
             */
            schedules: null,
            isEntering: false,
            /***
             * sideBar: show left sidebar when true, and hide when false
             */
            sideBar: true,
            /**
             * showSelectClass: when true, show the select-class sidebar if 'sideBar' is also true
             */
            showSelectClass: true,
            /**
             * showFilter: when true, show the filter sidebar if 'sideBar' is also true
             */
            showFilter: false,
            /**
             * showSetting: when true, show the settings sidebar if 'sideBar' is also true
             */
            showSetting: false,
            /**
             * @type {Course[]}
             */
            inputCourses: null,
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
            timeSlots: {},
            numberOfTimeSlots: 0,
            staticCardHeight: 500,
            enteringCardHeight: 500,
            timeSlotsRecord: [],

            storageVersion: 1,

            storageFields: [
                'currentSchedule',
                'proposedSchedule',
                'schedules',
                'allowWaitList',
                'allowClosed',
                'showTime',
                'showRoom',
                'showInstructor',
                'fullHeight',
                'partialHeight',
                'timeSlots',
                'storageVersion'
            ]
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
        },
        scheduleWidth() {
            return this.sideBar && (this.showSelectClass || this.showFilter || this.showSetting)
                ? 100 - 15 - 3 - 3
                : 100 - 3 - 3;
        },
        scheduleLeft() {
            return this.sideBar && (this.showSelectClass || this.showFilter || this.showSetting)
                ? 18
                : 3;
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
            this.generated = false;
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
                this.currentScheduleIndex = idx;
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
         * select a semester and fetch all its associated data
         * This method will assign a correct AllRecords object to `this.allRecords` and `Schedule.allRecords`
         * which will be either requested from remote or parsed from `localStorage`
         * @param {number} semesterId
         */
        selectSemester(semesterId) {
            this.currentSemester = this.semesters[semesterId];
            const data = localStorage.getItem(this.currentSemester.id);
            const defaultCallback = () => {
                this.schedules = null;
                this.currentSchedule = new Schedule();
                this.proposedSchedule = new Schedule();
                this.generated = false;
                this.currentScheduleIndex = 0;
                this.currentCourses = [];
                this.saveStatus();
            };
            if (data === null || data.length === 0) {
                // set to default values
                this.fetchSemesterData(semesterId, defaultCallback);
                return;
            }
            const raw_data = JSON.parse(data);
            // must assign allRecords prior to any other fields
            const storageVersion = raw_data.storageVersion;

            // storage version mismatch implies API update: use dafault data instead
            if (storageVersion !== this.storageVersion) {
                // clear local storage
                localStorage.clear();
                this.fetchSemesterData(semesterId, defaultCallback);
                return;
            }
            const temp = AllRecords.fromJSON(raw_data.allRecords);

            // things to do after allRecord is loaded
            const callback = () => {
                this.parseLocalData(raw_data);
                if (this.schedules !== null && this.schedules.length > 0) {
                    this.generated = true;
                }
                this.currentCourses = this.getCurrentCourses();
            };
            if (temp === null) {
                this.fetchSemesterData(semesterId, callback);
            } else {
                const now = new Date().getTime();
                const dataTime = new Date(raw_data.modified).getTime();

                // if data expires
                if (now - dataTime > 3600 * 1000) this.fetchSemesterData(semesterId, callback);
                else {
                    this.allRecords = temp;
                    Schedule.allRecords = temp;
                    callback();
                }
            }
        },
        /**
         * fetch basic class data for the given semester for fast class search and rendering
         * this method will assign `this.allRecords` and `Schedule.allRecords`
         * @param {number} semeseterId
         * @param {*} callback
         */
        fetchSemesterData(semesterId, callback) {
            console.info(`Loading semester ${semesterId} data from remote...`);
            axios.get(`${this.api}/classes?semester=${semesterId}`).then(res => {
                this.allRecords = new AllRecords(this.currentSemester, res.data.data);
                // important: assign all records
                Schedule.allRecords = this.allRecords;
                if (typeof callback === 'function') {
                    callback();
                }
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
            if (this.generated) {
                this.currentSchedule = this.proposedSchedule;
            }
            const generator = new ScheduleGenerator(this.allRecords);
            try {
                const table = generator.getSchedules(this.currentSchedule, {
                    timeSlots: this.timeSlotsRecord,
                    status: constraintStatus
                });
                table.sort();

                /**
                 * @type {RawSchedule}
                 */
                const translated_raw = [];
                for (const rd of table.schedules.slice(0, 100)) {
                    const raw_schedule = [];
                    for (const raw_course of rd.schedule) {
                        raw_schedule.push([raw_course[0], raw_course[3], -1]);
                    }
                    translated_raw.push(raw_schedule);
                }
                this.schedules = translated_raw;
                this.proposedSchedule = this.currentSchedule;
                this.generated = true;
                this.currentSchedule = new Schedule(this.schedules[0], 'Schedule', 1);
                this.currentCourses = this.getCurrentCourses();
                this.saveStatus();
            } catch (error) {
                this.errMsg = 'Bad constraint. Abort.';
            }
        },
        saveStatus() {
            localStorage.removeItem(this.currentSemester.id);

            // remove all stored allRecords field if it exists to free some storage space
            for (let i = 0; i < localStorage.length; i++) {
                let storedObj;
                try {
                    storedObj = JSON.parse(localStorage.getItem(localStorage.key(i)));
                } catch (e) {
                    continue;
                }

                if (storedObj.allRecords !== undefined) {
                    delete storedObj.allRecords;
                    localStorage.setItem(localStorage.key(i), JSON.stringify(storedObj));
                }
            }

            const obj = { modified: new Date().toJSON(), allRecords: this.allRecords.toJSON() };
            for (const field of this.storageFields) {
                // use toJSON method if it exists
                if (this[field] instanceof Object && typeof this[field].toJSON === 'function')
                    obj[field] = this[field].toJSON();
                else obj[field] = this[field];
            }
            localStorage.setItem(this.currentSemester.id, JSON.stringify(obj));
        },
        /**
         * @param {Object} raw_data
         */
        parseLocalData(raw_data) {
            for (const field of this.storageFields) {
                if (this[field] instanceof Object && typeof this[field].fromJSON === 'function')
                    this[field] = this[field].fromJSON(raw_data[field]);
                else if (raw_data[field] !== undefined && raw_data[field] !== null)
                    this[field] = raw_data[field];
            }
        },
        removeATimeConstraint(n) {
            this.$set(this.timeSlots, n, undefined);
        },
        addTimeSlot() {
            this.$set(this.timeSlots, this.numberOfTimeSlots, {});
            this.numberOfTimeSlots++;
        },
        addFilter() {
            for (const i in this.timeSlots) {
                if (this.timeSlots[i] === undefined) {
                    continue;
                }
                const startTime = this.timeSlots[i][0].split(':');
                const endTime = this.timeSlots[i][1].split(':');
                if (
                    isNaN(startTime[0]) ||
                    isNaN(startTime[1]) ||
                    isNaN(endTime[0]) ||
                    isNaN(endTime[1])
                ) {
                    this.errMsg = 'Illegal time input.';
                }
                const startMin = parseInt(startTime[0]) * 60 + parseInt(startTime[1]);
                const endMin = parseInt(endTime[0]) * 60 + parseInt(endTime[1]);
                this.timeSlotsRecord.push([startMin, endMin]);
            }
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

.sidebar {
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    z-index: 100; /* Behind the navbar */
    box-shadow: inset -1px 0 0 rgba(0, 0, 0, 0.1);
}

.button-bar {
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    z-index: 100; /* Behind the navbar */
    padding: 26px 0 0;
    box-shadow: inset -1px 0 0 rgba(0, 0, 0, 0.1);
}

.sidebar-sticky {
    position: relative;
    top: 0;
    height: calc(100vh - 48px);
    overflow-x: hidden;
    overflow-y: auto; /* Scrollable contents if viewport is shorter than content. */
}

.sidebar-brand {
    background-color: #acacac;
    color: white;
    width: 100%;
    padding: 5px 3px 5px;
}

.sidebar-item {
    padding: 5px 3px 5px;
    width: 100%;
}

.list-group-item {
    background-color: #f8f8f8;
}
</style>
