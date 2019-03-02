<template>
  <div id="app">
    <!-- navigation bar -->
    <nav class="navbar navbar-expand-lg navbar-light bg-primary">
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
          <!-- second item -->
          <li class="nav-item">
            <a class="nav-link text-light" href="#" aria-disabled="true">nav-item2</a>
          </li>
        </ul>
        <div class="my-2 my-lg-0 text-white" aria-disabled="true">nav-item4</div>
      </div>
    </nav>
    <!-- end of navigation bar -->
    <table style="width: 95%; margin: auto auto">
      <tr>
        <td style="width: 25%; vertical-align: top; padding-top: 0; padding-right: 2%">
          <!-- term selection dropdown -->
          <div class="dropdown">
            <button
              class="btn btn-secondary dropdown-toggle mt-3 mx-auto"
              style="width: 100%;"
              type="button"
              id="semester"
              data-toggle="dropdown"
            >{{ currentSemester === null ? 'Select Semester' : currentSemester.name }}</button>
            <div class="dropdown-menu" aria-labelledby="dropdownMenuButton">
              <a
                class="dropdown-item"
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
              placeholder="Department"
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
              placeholder="Course#"
              style="font-size: 10pt"
              aria-describedby="basic-addon1"
            >
          </div>

          <!--input title-->
          <div class="input-group mt-3">
            <div class="input-group-prepend">
              <span class="input-group-text" id="title" style="font-size:10pt">Course Name</span>
            </div>
            <input
              type="text"
              class="form-control"
              placeholder="Algorithm"
              style="font-size: 10pt"
              aria-describedby="basic-addon1"
            >
          </div>
          <div class="input-group mt-3">
            <!--input earliest time-->
            <div class="input-group-prepend">
              <span class="input-group-text" id="earliest" style="font-size:10pt">Earliest Time</span>
            </div>
            <input
              type="text"
              class="form-control"
              placeholder="8:00am"
              style="font-size: 10pt"
              aria-describedby="basic-addon1"
            >
            <!--input latest time-->
            <div class="input-group-prepend">
              <span class="input-group-text" id="latest" style="font-size:10pt">Latest Time</span>
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
          <div class="input-group mt-3">
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

          <!--submit button-->
          <button type="button" class="btn button mt-3 mb-3" onClick="add_class();">Submit</button>

          <div id="courses">
            <p>Current Selected Classes:</p>
            <!--display added class-->
          </div>

          <Active v-bind:schedule="schedule"></Active>

          <!--create button-->
          <div>
            <button type="button" class="btn button mt-3 mb-3" style="position:inherit;">Create</button>
          </div>
        </td>
        <td style="width: 68%; vertical-align: top;">
          <!-- Tab links -->
          <div class="tab mt-3">
            <button class="tablinks" onclick="openSchedule(event, 'Schedule 1')">Schedule 1</button>
            <button class="tablinks" onclick="openSchedule(event, 'Schedule 2')">Schedule 2</button>
            <button class="tablinks" onclick="openSchedule(event, 'Schedule 3')">Schedule 3</button>
          </div>

          <!-- Tab content -->
          <div id="Schedule 1" class="tabcontent">
            <h3>Schedule 1</h3>
            <p>Something.</p>
          </div>

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
import Schedule from './components/Schedule.vue';
import Active from './components/Active';

export default {
    name: 'app',
    components: {
        Active
    },
    data() {
        return {
            api: 'http://localhost:8000/api',
            semesters: [],
            currentSemester: null,
            courses: [],
            courseKeys: [],
            schedule: {
                title: 'Dummy asdsad',
                courses: [
                    {
                        id: 'asd',
                        title: 'asd'
                    },
                    {
                        id: 'asd1',
                        title: 'asd1'
                    }
                ]
            }
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
                for (const course of this.courses) {
                    if (course[9].indexOf(query) !== -1) return course;
                }
                return null;
            } else return this.courses[target_idx];
        },
        selectSemester(semesterId) {
            this.currentSemester = this.semesters[semesterId];
            this.$http.get(`${this.api}/classes?semester=${semesterId}`).then(res => {
                this.courses = res.data.data;
                this.courseKeys = res.data.keys;
            });
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
.button {
    border-radius: 3px;
    font-size: 12px;
    text-decoration: none;
    color: #1b3866;
    background-color: #f1c40f;
    box-shadow: 0px 4px 0px 0px #d8ab00;
    position: inherit;
}

.button:active {
    transform: translate(0px, 5px);
    -webkit-transform: translate(0px, 5px);
    box-shadow: 0px 1px 0px 0px;
}

.button:hover {
    background-color: rgb(241, 206, 3);
}
.tab {
    overflow: hidden;
    border: 1px solid #ccc;
    background-color: #f1f1f1;
    /* 
    width: 68%;
    position: fixed;
    left: 32%;
    top: 10%; */
}
/* Style the buttons that are used to open the tab content */
.tab button {
    background-color: inherit;
    float: left;
    border: none;
    outline: none;
    cursor: pointer;
    padding: 10px 30px;
    transition: 0.3s;
}

/* Change background color of buttons on hover */
.tab button:hover {
    background-color: rgb(116, 218, 95);
}

/* Create an active/current tablink class */
.tab button.active {
    background-color: rgb(161, 236, 110);
}

/* Style the tab content */
.tabcontent {
    display: none;
    padding: 10px 12px;
    border: 1px solid #ccc;
    border-top: none;
    /* 
    width: 68%;
    position: fixed;
    left: 32%;
    top: 16%; */
}
</style>