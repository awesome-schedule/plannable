<template>
  <div id="app">
    <!-- <course-modal v-bind:course="activeCourse"></course-modal> -->
    <!-- navigation bar -->
    <nav
      class="navbar navbar-expand-lg navbar-light"
      style="background-color:#F9A348;position:fixed;width:100%;z-index:5"
    >
      <!-- brand -->
      <a class="navbar-brand text-white" href="#">UVaAuotoScheduler</a>
      
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

      <div class="collapse navbar-collapse" id="navbarSupportedContent">
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
    <div>" "</div>
    <br>
    <br>
    <transition name="fade">
      <div
        class="alert alert-danger"
        role="alert"
        style="width:94%;margin-left:3%"
        v-if="errMsg.length > 0"
      >
        {{errMsg}}
        <button
          type="button"
          class="close"
          aria-label="Close"
          v-on:click="errMsg = ''"
          style="align:center"
          role="button"
        >
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
    </transition>

    <table style="width: 95%; margin: auto auto">
      <tr>
        <td
          id="leftBar"
          class="leftside"
          style="width: 20%; vertical-align: top; padding-top: 0; padding-right: 2%"
          v-if="sideBar"
        >
          <!-- term selection dropdown -->
          <div class="dropdown">
            <button
              class="btn btn-primary mt-4 mx-auto"
              style="width: 100%;"
              type="button"
              id="semester"
              data-toggle="dropdown"
            >{{ currentSemester === null ? 'Select Semester' : currentSemester.name }}</button>
            <div class="dropdown-menu" aria-labelledby="dropdownMenuButton" style="width: 100%;">
              <a
                class="dropdown-item"
                style="width: 100%;"
                href="#"
                v-for="semester in semesters"
                v-bind:key="semester.id"
                v-on:click="selectSemester(semester.id)"
              >{{ semester.name }}</a>
            </div>
          </div>

          <!--input title-->
          <div class="input-group mt-2">
            <input
              type="text"
              class="form-control"
              placeholder="Course Title"
              style="font-size: 10pt"
              aria-describedby="basic-addon1"
              @input="getClass($event.target.value)"
              v-on:keyup.esc="closeClassList($event)"
            >
          </div>
          <div v-if="!isEntering">
            <div class="mt-3">
              <button
                class="btn btn-primary"
                type="button"
                data-toggle="collapse"
                data-target="#filter"
                aria-expanded="true"
                aria-controls="filter"
                style="width:100%"
              >Filters</button>
            </div>

            <div id="filter" class="collapse show">
              <div class="card card-body">
                <div class="filter mt-2">
                  <div class="input-group">
                    <!--input earliest time-->
                    <!-- <div class="input-group-prepend">
                    <span class="input-group-text" id="earliest" style="font-size:10pt;">Earliest Time</span>-->
                    <button
                      type="button"
                      class="button dropdown-toggle dropdown-toggle-split"
                      data-toggle="dropdown"
                      aria-haspopup="true"
                      aria-expanded="false"
                    >
                      <span class="sr-only">Toggle Dropdown</span>
                    </button>
                    <div class="dropdown-menu" style="width:100%">
                      <a
                        class="dropdown-item"
                        href="#"
                        v-for="t in allTimes"
                        :key="t"
                        v-on:click="startTime = t"
                      >{{ t }}</a>
                    </div>

                    <input
                      type="text"
                      class="form-control"
                      placeholder="Earliest Time"
                      style="font-size: 10pt;"
                      aria-describedby="basic-addon1"
                      v-bind:value="startTime"
                      @input="startTime = $event.target.value; saveStatus()"
                    >
                  </div>

                  <div class="input-group mt-2">
                    <!--input latest time-->
                    <!-- <div class="input-group-prepend">
                    <span class="input-group-text" id="latest" style="font-size:10pt">Latest Time</span>-->
                    <button
                      type="button"
                      class="button dropdown-toggle dropdown-toggle-split"
                      data-toggle="dropdown"
                      aria-haspopup="true"
                      aria-expanded="false"
                    >
                      <span class="sr-only">Toggle Dropdown</span>
                    </button>
                    <div class="dropdown-menu" style="width:100%">
                      <a
                        class="dropdown-item"
                        href="#"
                        v-for="t in allTimes"
                        :key="t"
                        v-on:click="endTime = t"
                      >{{ t }}</a>
                    </div>
                    <input
                      type="text"
                      class="form-control"
                      placeholder="Latest Time"
                      style="font-size: 10pt"
                      aria-describedby="basic-addon1"
                      v-bind:value="endTime"
                      @input="endTime = $event.target.value; saveStatus()"
                    >
                  </div>

                  <div>
                    <label for="awt">Wait List</label>&nbsp;&nbsp;
                    <input type="checkbox" id="awt" v-bind="allowWaitlist">&nbsp;&nbsp;
                    <label for="ac">Closed</label>&nbsp;&nbsp;
                    <input type="checkbox" id="ac" v-bind="allowClosed">
                  </div>
                </div>
                <!--submit button-->
                <button
                  type="button"
                  class="btn btn-outline-success mt-2"
                  v-on:click="sendRequest"
                >Submit</button>
              </div>
            </div>

            <div class="mt-3">
              <button
                class="btn btn-primary"
                type="button"
                data-toggle="collapse"
                data-target="#currentSelectedClass"
                aria-expanded="true"
                aria-controls="currentSelectedClass"
                style="width:100%"
              >Current Selected Classes</button>
            </div>
            <div class="collapse show" id="currentSelectedClass">
              <div class="card card-body" style="padding:5px">
                <Active v-bind:schedule="currentSchedule" @remove_course="removeCourse"></Active>
                <div>
                  <button class="btn btn-primary mt-3" v-on:click="cleanSchedules">Clean Schedule</button>&nbsp;&nbsp;
                  <button class="btn btn-warning mt-3" v-on:click="clear">Clean All</button>
                </div>
              </div>
            </div>
          </div>
          <div class="mt-2">
            <ClassList
              v-if="isEntering"
              v-bind:courses="inputCourses"
              @add_course="addCourse"
              @remove_course="removeCourse"
              @close="closeClassList"
            ></ClassList>
          </div>
        </td>

        <td style="width: 68%; vertical-align: top;">
          <table style="width:100%">
            <tr>
              <td>
                <table style="width:100%">
                  <tr>
                    <td>
                      <button
                        class="btn btn-secondary"
                        data-toggle="popover"
                        data-target="#leftBar"
                        data-placement="bottom"
                        data-content="Click to hide or show left side-bar."
                        v-on:click="sideBar = !sideBar"
                      >Hide/Show</button>
                    </td>
                    <td>
                      <Pagination
                        class="mt-3"
                        v-if="schedules !== null && schedules.length > 0"
                        @switch_page="switchPage"
                        v-bind:indices="scheduleIndices"
                      ></Pagination>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td>
                <div class="tab mt-2"></div>

                <ScheduleView v-bind:courses="this.currentSchedule" @trigger-modal="triggerModal"></ScheduleView>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>
</template>

<script>
/* global $, objSchedulesPlan */
import ScheduleView from './components/Schedule';
import Active from './components/Active';
import ClassList from './components/ClassList';
import Pagination from './components/Pagination';
// import CourseModal from './components/CourseModal';
// eslint-disable-next-line
import { AllRecords, CourseRecord, Course } from './models/CourseRecord';
import { Schedule } from './models/Schedule';

export default {
    name: 'app',
    components: {
        Active,
        ScheduleView,
        ClassList,
        Pagination
        // CourseModal
    },
    data() {
        return {
            // api: `${window.location.protocol}//${window.location.host}/api`,
            api: 'http://localhost:8000/api',
            semesters: null,
            currentSemester: null,
            allCourses: null,
            currentSchedule: new Schedule(),
            schedules: null,
            isEntering: false,
            sideBar: true,
            inputCourses: null,
            activeCourse: {},
            startTime: '',
            endTime: '',
            allTimes: [],
            errMsg: '',
            allowWaitlist: false,
            allowClosed: false
        };
    },
    mounted() {
        this.$http.get(`${this.api}/semesters`).then(res => {
            this.semesters = res.data;
            this.selectSemester(0);
        });

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
    computed: {
        scheduleIndices() {
            const indices = new Array(this.schedules.length);
            for (let i = 0; i < indices.length; i++) indices[i] = i;
            return indices;
        }
    },
    methods: {
        clear() {
            this.cleanSchedule(this.currentSchedule);
            this.currentSchedule.All = [];
            this.schedules = [];
            this.saveStatus();
        },
        cleanSchedule(schedule) {
            for (const key of ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']) {
                schedule[key] = [];
            }
        },
        cleanSchedules() {
            this.schedules = [];
            this.cleanSchedule(this.currentSchedule);
        },

        triggerModal(id) {
            return id;
            // console.log(id);
            // for (const c of this.currentSchedule.All) {
            //     if (c.id == id) {
            //         this.activeCourse = c;
            //         // eslint-disable-next-line
            //         $('#course-div-modal').modal('show');
            //         return;
            //     }
            // }
        },
        /**
         * @param {Course} course
         */
        addCourse(course) {
            this.currentSchedule.add(course, true);
            this.refreshSchedule();
            this.saveStatus();
        },
        /**
         * @param {Course} course
         */
        removeCourse(course) {
            $('#active-list')
                .find('[data-toggle="popover"]')
                .popover('dispose');
            // popover.popover('disable');
            this.currentSchedule.remove(course);
            this.refreshStyle();
            this.saveStatus();
        },

        switchPage(idx) {
            if (0 <= idx && idx < this.schedules.length) this.currentSchedule = this.schedules[idx];
            this.refreshStyle();
        },
        /**
         * @param {string} query
         */
        getClass(query) {
            $('#class-list')
                .find('[data-toggle="popover"]')
                .popover('dispose');
            if (query === null || query.length === 0) {
                this.isEntering = false;
                this.inputCourses = null;
                return;
            }
            this.inputCourses = this.allCourses.search(query);
            this.isEntering = true;
            setTimeout(() => {
                $('#class-list')
                    .find('[data-toggle="popover"]')
                    .popover({ trigger: 'hover', html: true });
            }, 100);
        },
        selectSemester(semesterId) {
            this.currentSemester = this.semesters[semesterId];

            // fetch basic class data for the given semester for fast class search
            this.$http.get(`${this.api}/classes?semester=${semesterId}`).then(res => {
                this.allCourses = new AllRecords(res.data.data);
                // this.loadStatus();
            });
        },
        refreshSchedule() {
            setTimeout(() => {
                objSchedulesPlan[0].placeEvents();
            }, 10);
        },
        refreshPopover() {
            setTimeout(() => {
                $('#active-list')
                    .find('[data-toggle="popover"]')
                    .popover({ trigger: 'hover', html: true });
            }, 100);
        },
        refreshStyle() {
            this.refreshPopover();
            this.refreshSchedule();
        },
        disablePopover() {},
        closeClassList(event) {
            this.getClass('');
            event.target.value = '';
            this.refreshPopover();
        },
        parseResponse(res) {
            const data = res.data.data;
            const meta = res.data.meta;
            const schedules = [];

            // raw data is a list of list
            for (let x = 0; x < data.length; x++) {
                // raw schedule is a list of course ids
                const raw_schedule = data[x];

                const schedule = {
                    Monday: [],
                    Tuesday: [],
                    Wednesday: [],
                    Thursday: [],
                    Friday: [],
                    All: [],
                    title: `Schedule ${x}`,
                    id: x
                };

                schedules.push(schedule);

                for (let y = 0; y < raw_schedule.length; y++) {
                    let course = {
                        color: `event-${(y % 4) + 1}`
                    };

                    // get course_data from course id. This is an array
                    const course_arr = meta.course_data[raw_schedule[y]];
                    this.courseArrToObj(course_arr, meta.attr_map, course);

                    schedule.All.push(course);

                    // parse MoWeFr 11:00PM - 11:50PM style time
                    const [days, start, , end] = course.days.split(' ');
                    /**
                     * @type {string}
                     */
                    for (let i = 0; i < days.length; i += 2) {
                        // we need a copy of course
                        course = Object.assign({}, course);
                        switch (days.substr(i, 2)) {
                            case 'Mo':
                                schedule.Monday.push(course);
                                break;
                            case 'Tu':
                                schedule.Tuesday.push(course);
                                break;
                            case 'We':
                                schedule.Wednesday.push(course);
                                break;
                            case 'Th':
                                schedule.Thursday.push(course);
                                break;
                            case 'Fr':
                                schedule.Friday.push(course);
                                break;
                        }

                        // convert to 24h format
                        let suffix = start.substr(start.length - 2, 2);
                        if (suffix == 'PM') {
                            let [hour, minute] = start.substring(0, start.length - 2).split(':');
                            course.start = `${(+hour % 12) + 12}:${minute}`;

                            [hour, minute] = end.substring(0, end.length - 2).split(':');
                            course.end = `${(+hour % 12) + 12}:${minute}`;
                        } else {
                            course.start = start.substring(0, start.length - 2);
                            suffix = end.substr(end.length - 2, 2);
                            const end_time = end.substring(0, end.length - 2);
                            if (suffix == 'PM') {
                                const [hour, minute] = end_time.split(':');
                                course.end = `${(+hour % 12) + 12}:${minute}`;
                            } else {
                                course.end = end_time;
                            }
                        }
                    }
                }
            }

            // avoid updating style-binded variable in loops for better performace
            this.schedules = schedules;
            this.currentSchedule = this.schedules[0];
            this.saveStatus();
            this.errMsg = '';
            this.refreshStyle();
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

            for (const course of this.currentSchedule.All) {
                request.classes.push(
                    `${course.department}${course.number}${course.type}`.toLowerCase()
                );
            }
            this.$http.post(`${this.api}/classes`, request).then(res => {
                if (res.data.status.err.length > 0) {
                    this.errMsg = res.data.status.err;
                    this.schedules = [];
                    this.cleanSchedule(this.currentSchedule);
                    return;
                }
                if (res.data.data.length === 0) {
                    this.errMsg = 'No matching schedule satisfying the given constraints';
                    this.schedules = [];
                    this.cleanSchedule(this.currentSchedule);
                    return;
                }
                this.parseResponse(res);
            });
        },
        saveStatus() {
            localStorage.setItem(
                this.currentSemester.id,
                JSON.stringify({
                    schedules: this.schedules,
                    currentSchedule: this.currentSchedule,
                    startTime: this.startTime,
                    endTime: this.endTime
                })
            );
        },
        loadStatus() {
            const raw_data = JSON.parse(localStorage.getItem(this.currentSemester.id));
            if (
                raw_data !== null &&
                raw_data.schedules !== undefined &&
                raw_data.currentSchedule !== undefined
            ) {
                this.schedules = raw_data.schedules;
                this.currentSchedule = raw_data.currentSchedule;
                this.startTime = raw_data.startTime;
                this.endTime = raw_data.endTime;
                this.refreshStyle();
            }
        }
    }
};
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.5s;
}
.fade-enter, .fade-leave-to /* .fade-leave-active below version 2.1.8 */ {
    opacity: 0;
}
</style>