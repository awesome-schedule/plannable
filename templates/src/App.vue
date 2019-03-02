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
            <a class="nav-link text-light" href="#" aria-disabled="true">Contact
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
    <table style="width:30%">
      <tr>
        <td style="width: 30%;">
          <!-- term selection dropdown -->
          <div class="dropdown">
            <button
              class="btn btn-secondary dropdown-toggle mt-3 mx-auto"
              style="width: 100%;"
              type="button"
              id="semester"
              data-toggle="dropdown"
            >Select Term</button>
            <div class="dropdown-menu" aria-labelledby="dropdownMenuButton">
              <a class="dropdown-item" href="#">Spring 2019</a>
              <a class="dropdown-item" href="#">Fall 2018</a>
              <a class="dropdown-item" href="#">Spring 2018</a>
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

          <!--create button-->
          <div>
            <button type="button" class="btn button mt-3 mb-3" style="position:inherit;">Create</button>
          </div>

          <!--popover button for current active course list-->
          <button
            type="button"
            class="btn btn-lg btn-danger"
            data-toggle="popover"
            title="Current Schedule"
            data-content="Something."
          >Current Active Schedule</button>
        </td>
      </tr>
    </table>

    <!-- Tab links -->
    <div class="tab">
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
    <Active></Active>
  </div>
</template>

<script>
import Active from './components/Active';

export default {
    name: 'app',
    components: {
        Active
    },
    data() {
        return {
            api: 'http://localhost:8000/api',
            semesters: []
        };
    },
    mounted() {
        this.$http.get(`${this.api}/semesters`).then(res => {
            this.semesters = res.data;
        });
    }
};
</script>

<style>
#app {
    font-family: 'Avenir', Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-align: center;
    color: #2c3e50;
    margin-top: 60px;
}
</style>
