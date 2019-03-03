<template>
  <div id="app">
    <!-- navigation bar -->
    <nav class="navbar navbar-expand-lg navbar-light" style="background-color:#F9A348;">
      <!-- brand -->
      <a class="navbar-brand text-white" href="#">UNOne</a>
      
      <button
        class="navbar-toggler"
        type="button"
        data-toggle="collapse"
        data-target="#navbarSupportedContent"
        aria-controls="navbarSupportedContent"
        aria-expanded="false"
        aria-label="Toggle navigation"
      >
        <span class="navbar-toggler-icon"></span>
      </button>

      <div class="collapse navbar-collapse" id="navbarSupportedContent">
        <ul class="navbar-nav mr-auto">
          <!-- first item -->
          <li class="nav-item">
            <a class="nav-link text-light" href="#" aria-disabled="true">
              Contact
              <span class="sr-only">(current)</span>
            </a>
          </li>
        </ul>
      </div>
    </nav>
    <!-- end of navigation bar -->
    <table style="width: 95%; margin: auto auto">
      <tr>
        <td
          class="leftside"
          style="width: 25%; vertical-align: top; padding-top: 0; padding-right: 2%"
        >
          <!-- term selection dropdown -->
          <div class="dropdown">
            <button
              class="button mt-2 mx-auto"
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

          <div class="input-group">
            <!-- input department-->
            <div class="input-group-prepend">
              <span class="input-group-text" id="dept" style="font-size:10pt">Department</span>
            </div>
            <input
              type="text"
              class="form-control"
              placeholder="CS"
              style="font-size: 10pt; align-content: center"
              aria-describedby="basic-addon1"
            >
            <!--input course number-->
            <div class="input-group-prepend">
              <span class="input-group-text" id="num" style="font-size:10pt">Course#</span>
            </div>
            <input
              type="text"
              class="form-control"
              placeholder="1110"
              style="font-size: 10pt"
              aria-describedby="basic-addon1"
            >
          </div>
          <!--input title-->
          <div class="input-group mt-2">
            <div class="input-group-prepend">
              <span class="input-group-text" id="title" style="font-size:10pt">Course Name</span>
            </div>
            <input
              type="text"
              class="form-control"
              placeholder="Algorithm"
              style="font-size: 10pt"
              aria-describedby="basic-addon1"
              @input="expandClass(getClass($event.target.value.toLowerCase()))"
            >
          </div>

          <div class="input-group">
            <!--filter button-->
            <div class="input-group-prepend" style="width: 100%;">
              <button type="button" class="button mt-2" style="width:90%;">Filter</button>
              <button
                type="button"
                class="filter-button dropdown-toggle dropdown-toggle-split mt-2"
                data-toggle="dropdown"
                aria-haspopup="true"
                aria-expanded="false"
              >
                <span class="sr-only">Toggle Dropdown</span>
              </button>
            </div>
          </div>
          <div class="filter">
            <div class="input-group">
              <!--input earliest time-->
              <div class="input-group-prepend">
                <span class="input-group-text" id="earliest" style="font-size:10pt;">Earliest Time</span>
                <button
                  type="button"
                  class="button dropdown-toggle dropdown-toggle-split"
                  data-toggle="dropdown"
                  aria-haspopup="true"
                  aria-expanded="false"
                >
                  <span class="sr-only">Toggle Dropdown</span>
                </button>
                <div class="dropdown-menu">
                  <a class="dropdown-item" href="#">8:00am</a>
                  <a class="dropdown-item" href="#">8:30am</a>
                  <a class="dropdown-item" href="#">9:00am</a>
                  <a class="dropdown-item" href="#">9:30am</a>
                  <a class="dropdown-item" href="#">10:00am</a>
                  <a class="dropdown-item" href="#">10:30am</a>
                  <a class="dropdown-item" href="#">11:00am</a>
                  <a class="dropdown-item" href="#">11:30am</a>
                  <a class="dropdown-item" href="#">12:00am</a>
                  <a class="dropdown-item" href="#">12:30am</a>
                  <a class="dropdown-item" href="#">13:00am</a>
                  <a class="dropdown-item" href="#">13:30am</a>
                  <a class="dropdown-item" href="#">14:00am</a>
                  <a class="dropdown-item" href="#">14:30am</a>
                  <a class="dropdown-item" href="#">15:00am</a>
                  <a class="dropdown-item" href="#">15:30am</a>
                  <a class="dropdown-item" href="#">16:00am</a>
                  <a class="dropdown-item" href="#">16:30am</a>
                  <a class="dropdown-item" href="#">17:00am</a>
                  <a class="dropdown-item" href="#">17:30am</a>
                  <a class="dropdown-item" href="#">18:00am</a>
                  <a class="dropdown-item" href="#">18:30am</a>
                  <a class="dropdown-item" href="#">19:00am</a>
                  <a class="dropdown-item" href="#">19:30am</a>
                  <a class="dropdown-item" href="#">20:00am</a>
                  <a class="dropdown-item" href="#">20:30am</a>
                  <a class="dropdown-item" href="#">21:00am</a>
                  <a class="dropdown-item" href="#">21:30am</a>
                </div>
              </div>
              <input
                type="text"
                class="form-control"
                placeholder="8:00am"
                style="font-size: 10pt;"
                aria-describedby="basic-addon1"
              >
            </div>

            <div class="input-group mt-2">
              <!--input latest time-->
              <div class="input-group-prepend">
                <span class="input-group-text" id="latest" style="font-size:10pt">Latest Time</span>
                <button
                  type="button"
                  class="button dropdown-toggle dropdown-toggle-split"
                  data-toggle="dropdown"
                  aria-haspopup="true"
                  aria-expanded="false"
                >
                  <span class="sr-only">Toggle Dropdown</span>
                </button>
                <div class="dropdown-menu">
                  <a class="dropdown-item" href="#">8:00am</a>
                  <a class="dropdown-item" href="#">8:30am</a>
                  <a class="dropdown-item" href="#">9:00am</a>
                  <a class="dropdown-item" href="#">9:30am</a>
                  <a class="dropdown-item" href="#">10:00am</a>
                  <a class="dropdown-item" href="#">10:30am</a>
                  <a class="dropdown-item" href="#">11:00am</a>
                  <a class="dropdown-item" href="#">11:30am</a>
                  <a class="dropdown-item" href="#">12:00am</a>
                  <a class="dropdown-item" href="#">12:30am</a>
                  <a class="dropdown-item" href="#">13:00am</a>
                  <a class="dropdown-item" href="#">13:30am</a>
                  <a class="dropdown-item" href="#">14:00am</a>
                  <a class="dropdown-item" href="#">14:30am</a>
                  <a class="dropdown-item" href="#">15:00am</a>
                  <a class="dropdown-item" href="#">15:30am</a>
                  <a class="dropdown-item" href="#">16:00am</a>
                  <a class="dropdown-item" href="#">16:30am</a>
                  <a class="dropdown-item" href="#">17:00am</a>
                  <a class="dropdown-item" href="#">17:30am</a>
                  <a class="dropdown-item" href="#">18:00am</a>
                  <a class="dropdown-item" href="#">18:30am</a>
                  <a class="dropdown-item" href="#">19:00am</a>
                  <a class="dropdown-item" href="#">19:30am</a>
                  <a class="dropdown-item" href="#">20:00am</a>
                  <a class="dropdown-item" href="#">20:30am</a>
                  <a class="dropdown-item" href="#">21:00am</a>
                  <a class="dropdown-item" href="#">21:30am</a>
                </div>
              </div>
              <input
                type="text"
                class="form-control"
                placeholder="5:00pm"
                style="font-size: 10pt"
                aria-describedby="basic-addon1"
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
          </div>
          <!--submit button-->
          <button
            type="button"
            class="btn btn-outline-success mt-1 mb-1"
            onClick="add_class();"
          >Submit</button>

          <div id="courses">
            <p>Current Selected Classes:</p>
            <!--display added class-->
          </div>

          <Active v-bind:schedule="currentSchedule"></Active>

          <!--create button-->
          <div>
            <button
              type="button"
              class="btn btn-outline-success mt-1 mb-1"
              style="position:inherit;"
            >Create</button>
          </div>
        </td>

        <td style="width: 68%; vertical-align: top;">
          <!-- Tab links -->
          <div class="tab mt-2">
            <button
              class="bt-sidebar"
              data-toggle="popover"
              data-placement="bottom"
              data-content="Click to hide or show left side-bar."
            >§</button>
            <button class="tablinks" onclick="openSchedule(event, 'Schedule 1')">Schedule 1</button>
            <button class="tablinks" onclick="openSchedule(event, 'Schedule 2')">Schedule 2</button>
            <button class="tablinks" onclick="openSchedule(event, 'Schedule 3')">Schedule 3</button>
          </div>

          <!-- Tab content -->
          <div id="Schedule 1" class="tabcontent">
            <h3>Schedule 1</h3>
            <!-- <p>Something.</p> -->
            <!-- <Schedule></Schedule> -->
          </div>
          <Schedule v-bind:courses="asd"></Schedule>
          <div id="Schedule 2" class="tabcontent">
            <h3>Schedule 2</h3>
            <p>Something.</p>
          </div>

          <div id="Schedule 3" class="tabcontent">
            <h3>Schedule 3</h3>
            <p>Something.</p>
          </div>
        </td>
      </tr>
    </table>
  </div>
</template>

<script>
import Schedule from './components/Schedule';
import Active from './components/Active';

export default {
    name: 'app',
    components: {
        Active,
        Schedule
    },
    data() {
        return {
            api: 'http://localhost:8000/api',
            semesters: [],
            currentSemester: null,
            courses: [],
            courseKeys: [],
            asd: [
                [
                    'CS',
                    '2150',
                    '001',
                    'Lecture',
                    3,
                    'Mark',
                    'MoWeFr11:00',
                    'olsson120',
                    'pdr',
                    'cs',
                    'closed',
                    150,
                    150,
                    150,
                    'pdr',
                    ['Monday', 'Wednesday', 'Friday'],
                    '11:00',
                    '11:50',
                    'event-1'
                ],
                [
                    'CS',
                    '3102',
                    '001',
                    'Lecture',
                    3,
                    'Nathan',
                    'MoWeFr12:00',
                    'olsson120',
                    'theory',
                    'cs',
                    'closed',
                    150,
                    150,
                    150,
                    'dfa',
                    ['Tuesday', 'Thursday'],
                    '12:00',
                    '13:50',
                    'event-2'
                ]
            ],
            currentSchedule: null,
            schedules: []
        };
    },
    mounted() {
        this.$http.get(`${this.api}/semesters`).then(res => {
            this.semesters = res.data;
            this.selectSemester(0);
        });
    },
    methods: {
        /**
         * @param {string} query
         * @returns {any[]}
         */
        getClass(query) {
            const max_results = 10;
            /**
             * @type {string[]}
             */
            const arr = this.courseKeys;
            const len = query.length;
            let start = 0,
                end = arr.length - 1;

            let target_idx = -1;

            // do a binary search on the keys of courses
            while (start <= end) {
                let mid = Math.floor((start + end) / 2);

                const ele = arr[mid].substr(0, len);
                // If element is present at mid, return True
                if (ele === query) {
                    target_idx = mid;
                    break;
                }
                // Else look in left or right half accordingly
                else if (ele < query) {
                    start = mid + 1;
                } else end = mid - 1;
            }

            if (target_idx === -1) {
                for (const key in this.courses) {
                    const course = this.courses[key];
                    if (course[9].toLowerCase().indexOf(query) !== -1) return course;
                }
                return null;
            } else return this.courses[this.courseKeys[target_idx]];
        },
        expandClass(course) {
            console.log(course);
        },
        selectSemester(semesterId) {
            this.currentSemester = this.semesters[semesterId];
            this.$http.get(`${this.api}/classes?semester=${semesterId}`).then(res => {
                this.courses = res.data.data;
                this.courseKeys = res.data.keys;
            });
        },
        parseResponse(res) {
            const data = res.data.data;
            const meta = res.data.meta;
            this.schedules = [];
            for (let x = 0; x < data.length; x++) {
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
                const course = {};

                for (let y = 0; y < raw_schedule.length; y++) {
                    const raw_course = raw_schedule[y];
                    for (const idx in meta) {
                        course[meta] = raw_course[+idx];
                    }
                    /**
                     * @type {string}
                     */
                    // parse MoWeFr 11:00PM - 11:50PM style time
                    const [days, start, end] = course.days.split(' ');
                    /**
                     * @type {string}
                     */
                    for (let i = 0; i < days; i += 2) {
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
                        schedule.All.push(course);
                        let suffix = start.substr(start.length - 3, 2);
                        if (suffix == 'PM') {
                            const [hour, minute] = start.substring(0, start.length - 2).split(':');
                            course.start = `${(+hour % 12) + 12}:${minute}`;
                            course.end = `${(+hour % 12) + 12}:${minute}`;
                        } else {
                            course.start = start.substring(0, start.length - 2);
                            suffix = end.substr(end.length - 3, 2);
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
            this.currentSchedule = this.schedules[0];
        }
    }
};


</script>

<style scoped>
/* #app {
    font-family: 'Avenir', Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-align: center;
    color: #2c3e50;
    margin-top: 60px;
} */
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
</style>