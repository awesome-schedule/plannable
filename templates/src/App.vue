<template>
  <div id="app">
    <!-- navigation bar -->
    <nav
      class="navbar navbar-expand-lg navbar-light"
      style="background-color:#F9A348;position:fixed;width:100%;z-index:5"
    >
      <!-- brand -->
      <a class="navbar-brand text-white" href="#">UNOne</a>
      
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
            <a class="nav-link text-light" href="./contact.html" aria-disabled="true">
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

          <div class="input-group mt-2">
            <!-- input department-->
            <!-- <div class="input-group-prepend">
              <span class="input-group-text" id="dept" style="font-size:10pt">Department</span>
            </div>-->
            <input
              type="text"
              class="form-control"
              placeholder="Dept"
              style="font-size: 10pt; align-content: center"
              aria-describedby="basic-addon1"
            >
            <!--input course number-->
            <!-- <div class="input-group-prepend">
              <span class="input-group-text" id="num" style="font-size:10pt">Course#</span>
            </div>-->
            <input
              type="text"
              class="form-control"
              placeholder="Course#"
              style="font-size: 10pt"
              aria-describedby="basic-addon1"
            >
          </div>
          <!--input title-->
          <div class="input-group mt-2">
            <!-- <div class="input-group-prepend">
              <span class="input-group-text" id="title" style="font-size:10pt">Course Name</span>
            </div>-->
            <input
              type="text"
              class="form-control"
              placeholder="Course Title"
              style="font-size: 10pt"
              aria-describedby="basic-addon1"
              @input="getClass($event.target.value.toLowerCase())"
              v-on:keyup.esc="$event.target.value = ''; isEntering = false "
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
                    <!-- </div> -->
                    <input
                      type="text"
                      class="form-control"
                      placeholder="Latest Time"
                      style="font-size: 10pt"
                      aria-describedby="basic-addon1"
                      v-bind:value="endTime"
                    >
                  </div>

                  <!--input maximum class number per day-->
                  <div class="input-group mt-2">
                    <div class="input-group-prepend">
                      <span class="input-group-text" id="max" style="font-size:10pt">max classes/day</span>
                    </div>
                    <input
                      type="text"
                      class="form-control"
                      placeholder="2"
                      style="font-size: 10pt"
                      aria-describedby="basic-addon1"
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
            </div>removeCourse
            <div class="collapse show" id="currentSelectedClass">
              <div class="card card-body" style="padding:5px">
                <Active v-bind:schedule="currentSchedule" @remove_course="removeCourse"></Active>
                <div>
                  <!-- <button
                    type="button"
                    class="btn btn-outline-success mt-2"
                    style="position:inherit;"
                  >Create</button>-->
                </div>
              </div>
            </div>
          </div>
          <div class="mt-2">
            <ClassList v-if="isEntering" v-bind:courses="inputCourses" @add_course="addClass"></ClassList>
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

                <Schedule v-bind:courses="this.currentSchedule" @trigget-modal="triggerModal"></Schedule>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <course-modal id="modal" v-if="activeCourse !== null" v-bind:course="activeCourse"></course-modal>
  </div>
</template>

<script>
import Schedule from './components/Schedule';
import Active from './components/Active';
import ClassList from './components/ClassList';
import Pagination from './components/Pagination';
import CourseModal from './components/CourseModal';

export default {
    name: 'app',
    components: {
        Active,
        Schedule,
        ClassList,
        Pagination,
        CourseModal
    },
    data() {
        return {
            api: 'http://localhost:8000/api',
            semesters: null,
            currentSemester: null,
            courses: null,
            courseKeys: null,
            currentSchedule: {
                Monday: [],
                Tuesday: [],
                Wednesday: [],
                Thursday: [],
                Friday: [],
                All: [],
                title: `Schedule`,
                id: 0
            },
            schedules: null,
            attr_map: null,
            isEntering: false,
            sideBar: true,
            inputCourses: null,
            activeCourse: null,
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
        refreshPopover() {
            setTimeout(() => {
                // eslint-disable-next-line
                $('[data-toggle="popover"]').popover({ trigger: 'hover' });
            }, 10);
        },

        removeCourse(id) {
            for (let i = 0; i < this.currentSchedule.All.length; i++) {
                if (this.currentSchedule.All[i].id === id) {
                    // eslint-disable-next-line
                    $('[data-toggle="popover"]').popover('hide');
                    // eslint-disable-next-line
                    $('[data-toggle="popover"]').popover('disable');
                    this.currentSchedule.All.splice(i, 1);
                    for (const key of ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']) {
                        const day = this.currentSchedule[key];
                        for (let j = 0; j < day.length; j++) {
                            if (day[j].id === id) {
                                day.splice(j, 1);
                                break;
                            }
                        }
                    }
                    // eslint-disable-next-line
                    $('[data-toggle="popover"]').popover('enable');
                    this.saveStatus();
                    this.$forceUpdate();
                    this.refreshStyle();
                    break;
                }
            }
        },

        triggerModal(id) {
            console.log(id);
            for (const c of this.currentSchedule.All) {
                if (c.id == id) {
                    this.activeCourse = c;

                    // eslint-disable-next-line
                    $('#course-modal-div').modal('show');
                    return;
                }
            }
        },

        addClass(crs) {
            for (const c of this.currentSchedule.All) {
                if (c.id === crs.id) return;
            }
            this.currentSchedule.All.push(crs);
            this.saveStatus();
        },
        switchPage(idx) {
            if (0 <= idx && idx < this.schedules.length) this.currentSchedule = this.schedules[idx];
            this.refreshStyle();
        },
        /**
         * @param {string} query
         * @returns {any[]}
         */
        getClass(query) {
            query = query.toLowerCase();
            if (query.length === 0) {
                this.isEntering = false;
                this.inputCourses = null;
                return null;
            }
            const max_results = 10;
            let results = [];
            /**
             * @type {string[]}
             */
            // const arr = this.courseKeys;
            // const len = query.length;
            // let start = 0,
            //     end = arr.length - 1;

            // // do a binary search on the keys of courses for efficiency
            // while (start <= end) {
            //     let mid = Math.floor((start + end) / 2);

            //     // for course number (e.g. CS3102), we only check the beginning
            //     const ele = arr[mid].substr(0, len);

            //     if (ele === query) {
            //         // when a match is found, we go up and down to look up more choices
            //         results.push(this.courseArrToObj(this.courses[arr[mid]], this.attr_map, {}));
            //         let increment = 1;
            //         while (
            //             results.length < max_results * 2 &&
            //             arr[mid + increment].substr(0, len) === query
            //         ) {
            //             results.push(
            //                 this.courseArrToObj(
            //                     this.courses[arr[mid + increment]],
            //                     this.attr_map,
            //                     {}
            //                 )
            //             );
            //             increment += 1;
            //         }
            //         increment = -1;
            //         while (
            //             results.length < max_results * 2 &&
            //             arr[mid + increment].substr(0, len) === query
            //         ) {
            //             results.push(
            //                 this.courseArrToObj(
            //                     this.courses[arr[mid + increment]],
            //                     this.attr_map,
            //                     {}
            //                 )
            //             );
            //             increment -= 1;
            //         }
            //         break;
            //     } else if (ele < query) {
            //         start = mid + 1;
            //     } else end = mid - 1;
            // }

            // if (results.length > max_results) {
            //     const margin = Math.floor((results.length - max_results) / 2);
            //     results = results.slice(margin, results.length - margin);
            // }

            // if no results are found, we perform linear search in the array of titles
            const exist = x => {
                return results.some(ele => ele.id === x[0]);
            };
            if (results.length === 0) {
                for (const key of this.courseKeys) {
                    const course = this.courses[key];
                    if (key.indexOf(query) !== -1 && !exist(course)) {
                        results.push(this.courseArrToObj(this.courses[key], this.attr_map, {}));
                        if (results.length >= max_results) break;
                    }
                }
                for (const key in this.courses) {
                    const course = this.courses[key];
                    if (course[9].toLowerCase().indexOf(query) !== -1 && !exist(course)) {
                        results.push(this.courseArrToObj(course, this.attr_map, {}));
                        if (results.length >= max_results) break;
                    }
                }
            }

            this.inputCourses = results;
            this.isEntering = true;
        },
        selectSemester(semesterId) {
            this.currentSemester = this.semesters[semesterId];

            // fetch basic class data for the given semester for fast class search
            this.$http.get(`${this.api}/classes?semester=${semesterId}`).then(res => {
                this.courses = res.data.data;
                this.courseKeys = res.data.keys;
                this.attr_map = res.data.meta.attr_map;
                this.loadStatus();
            });
        },
        refreshStyle() {
            setTimeout(() => {
                // eslint-disable-next-line
                $('[data-toggle="popover"]').popover({ trigger: 'hover' });
                // eslint-disable-next-line
                objSchedulesPlan[0].placeEvents();
            }, 20);
        },
        /**
         * @param {any[]} arr
         * @param {Object<string, string>} attr_map
         * @param {Object<string, string>} obj
         */
        courseArrToObj(arr, attr_map, obj) {
            for (const idx in attr_map) {
                if (+idx >= arr.length) break;
                // bind properties to course object
                obj[attr_map[idx]] = arr[+idx];
            }
            return obj;
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
            this.refreshStyle();
        },
        sendRequest() {
            // if (this.currentSchedule.All.length < 2) return;
            const request = {
                classes: [],
                semester: this.currentSemester,
                num: 10,
                filter: {
                    days: [
                        `MoTuWeThFr 00:00AM - ${this.startTime}`,
                        `MoTuWeThFr ${this.endTime} - 10:00PM`
                    ]
                }
            };

            for (const course of this.currentSchedule.All) {
                request.classes.push(
                    `${course.department}${course.number}${course.type}`.toLowerCase()
                );
            }
            this.$http.post(`${this.api}/classes`, request).then(res => {
                if (res.data.status.err.length > 0) {
                    this.errMsg = res.data.status.err;
                    return;
                }
                if (res.data.data.length === 0) {
                    this.errMsg = 'No matching schedule satisfying the given constraints';
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
.dropdown-menu {
    overflow: auto;
    max-height: 100px;
}
.filter-button {
    border-radius: 3px;
    background-color: #78a7ec;
}
.button {
    border-radius: 3px;
    font-size: 20px;
    text-decoration: none;
    color: #1b3866;
    background-color: #78a7ec;
    position: inherit;
}

.button:active {
    box-shadow: 0px 1px 0px 0px;
}

.button:hover {
    background-color: rgb(56, 124, 212);
}
.tab {
    overflow: hidden;
    border: 1px solid #ccc;
    background-color: #78a7ec;
    border-radius: 3px;
}
/* Style the buttons that are used to open the tab content */
.tab button {
    background-color: inherit;
    float: left;
    border: none;
    outline: none;
    cursor: pointer;
    padding: 6px 20px;
    transition: 0.3s;
}

/* Change background color of buttons on hover */
.tab button:hover {
    background-color: rgb(56, 124, 212);
}

/* Create an active/current tablink class */
.tab button.active {
    background-color: rgb(136, 224, 47);
    box-shadow: 0px 1px 0px 0px;
}

/* Style the tab content */
.tabcontent {
    display: none;
    padding: 10px 12px;
    border: 1px solid #ccc;
    border-top: none;
}
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.5s;
}
.fade-enter, .fade-leave-to /* .fade-leave-active below version 2.1.8 */ {
    opacity: 0;
}
</style>