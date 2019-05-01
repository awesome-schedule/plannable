<template>
    <div id="info-panel">
        <nav id="navbar-scrollspy" class="navbar d-block navbar-light bg-light sidebar">
            <a class="navbar-brand" href="#">Website Guide</a>
            <nav class="nav nav-pills flex-column">
                <a class="nav-link" href="#item-1">General Introduction</a>
                <a class="nav-link" href="#item-2">Basic Operations</a>
                <nav class="nav nav-pills flex-column">
                    <a class="nav-link ml-3 my-1" href="#item-2-1">Add Courses</a>
                    <a class="nav-link ml-3 my-1" href="#item-2-2">Multiple set of class</a>
                </nav>
                <a class="nav-link" href="#item-3">Add Event</a>
                <a class="nav-link" href="#item-4">Filters</a>
                <a class="nav-link" href="#item-5">Display Settings</a>
                <a class="nav-link" href="#item-6">Customize Colors</a>
                <a class="nav-link" href="#item-7">Export ICalendar</a>
                <nav class="nav nav-pills flex-column">
                    <a class="nav-link ml-3 my-1" href="#item-7-1">Item 3-1</a>
                    <a class="nav-link ml-3 my-1" href="#item-7-2">Item 3-2</a>
                </nav>
            </nav>
        </nav>
        <div
            :style="{ 'margin-left': scheduleLeft + 'vw' }"
            data-spy="scroll"
            data-target="#navbar-scrollspy"
            data-offset="10"
        >
            <h4 id="item-1">General Introduction</h4>
            <p>
                This is a website which helps UVa students to schedule their classes more
                efficiently. Get your class selection done with the searching field and customize
                them with filters. The website can generate all possible schedules according to your
                requirements.
            </p>
            <h4 id="item-2">Basic Operations</h4>
            <h5 id="item-2-1">Add Courses</h5>
            <p>
                You can add courses by searching department, professor, class number, or keywords.
                Pick a session you want, or choose "Any Section" if you don't have a preference.
                Click the delete button at the right of search field to clear the entry and search
                for other classes. After you finished adding, you can a class list under "Edited
                Classes".
            </p>
            <h5 id="item-2-2">Multiple set of class</h5>
            <p>
                You can save more than one set of classes you want to take! Click the add icon near
                the right arrow, you can add another set of classes as a separate schedule. The
                number displayed shows which set of schedule you are editing. Click the rightmost
                icon to delete a schedule. If you have certain classes you need to take regardless,
                click the middle icon to ...
            </p>
            <!-- picture slides illustration -->
            <div class="bd-example">
                <div id="carouselExampleCaptions" class="carousel slide" data-ride="carousel">
                    <ol class="carousel-indicators">
                        <li
                            data-target="#carouselExampleCaptions"
                            data-slide-to="0"
                            class="active"
                        ></li>
                        <li data-target="#carouselExampleCaptions" data-slide-to="1"></li>
                        <li data-target="#carouselExampleCaptions" data-slide-to="2"></li>
                    </ol>
                    <div class="carousel-inner">
                        <div class="carousel-item active">
                            <img
                                src="../assets/placeholder.png"
                                class="first-slide"
                                alt="First slide"
                            />
                            <div class="carousel-caption d-none d-md-block">
                                <h5>First slide label</h5>
                                <p>
                                    Nulla vitae elit libero, a pharetra augue mollis interdum.
                                </p>
                            </div>
                        </div>
                        <div class="carousel-item">
                            <img
                                src="../assets/placeholder.png"
                                class="second-slide"
                                alt="Second slide"
                            />
                            <div class="carousel-caption d-none d-md-block">
                                <h5>Second slide label</h5>
                                <p>
                                    Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                                </p>
                            </div>
                        </div>
                        <div class="carousel-item">
                            <img
                                src="../assets/placeholder.png"
                                class="third-slide"
                                alt="Third slide"
                            />
                            <div class="carousel-caption d-none d-md-block">
                                <h5>Third slide label</h5>
                                <p>
                                    Praesent commodo cursus magna, vel scelerisque nisl consectetur.
                                </p>
                            </div>
                        </div>
                    </div>
                    <a
                        class="carousel-control-prev"
                        href="#carouselExampleCaptions"
                        role="button"
                        data-slide="prev"
                    >
                        <span class="carousel-control-prev-icon" aria-hidden="true"></span>
                        <span class="sr-only">Previous</span>
                    </a>
                    <a
                        class="carousel-control-next"
                        href="#carouselExampleCaptions"
                        role="button"
                        data-slide="next"
                    >
                        <span class="carousel-control-next-icon" aria-hidden="true"></span>
                        <span class="sr-only">Next</span>
                    </a>
                </div>
            </div>

            <h3 id="item-3" class="text-primary">3. Add Event</h3>
            <p>
               This feature allows you to customize your own schedule. You can add your weekly commitments on the schedule,
               such as club meetings, office hours, etc. This feature is similar to any other calendar which later you can sync it with
               your personal calender on google or apple.
            </p>
            <h3 id="item-4" class="text-primary">4. Filters</h3>
            <p>
                Filters allow you to set parameters to better navigate your searches and generate your schedules
            </p>
            <h3 id="item-5" class="text-primary">5. Display Settings</h3>
            <h3 id="item-5" class="text-primary">5. Customize Colors</h3>
            <h3 id="item-7" class="text-primary">7. Export ICalendar</h3>
            <p>
                ICalendar is a standard file which you can import to your Apple/Google Calendar.
                This website allows you to download the ICalendar to your computer after you have
                creatd your schedule. Then, you can go to your Apple/Google Calendar and then
                syncronize your schedule. Instruction is shown below:
            </p>
            <h4 id="item-7-1" class="text-success">Google Calendar</h4>
            <div class="bd-example">
                <div id="googleCalendarInstruction" class="carousel slide" data-ride="carousel">
                    <ol class="carousel-indicators">
                        <li
                            data-target="#googleCalendarInstruction"
                            data-slide-to="0"
                            class="active"
                        ></li>
                        <li data-target="#googleCalendarInstruction" data-slide-to="1"></li>
                        <li data-target="#googleCalendarInstruction" data-slide-to="2"></li>
                        <li data-target="#googleCalendarInstruction" data-slide-to="3"></li>
                        <li data-target="#googleCalendarInstruction" data-slide-to="4"></li>
                        <li data-target="#googleCalendarInstruction" data-slide-to="5"></li>
                        <li data-target="#googleCalendarInstruction" data-slide-to="6"></li>
                        <li data-target="#googleCalendarInstruction" data-slide-to="7"></li>
                        <li data-target="#googleCalendarInstruction" data-slide-to="8"></li>
                    </ol>
                    <div class="carousel-inner text-center">
                        <div class="carousel-item active">
                            <img src="../assets/gcal1.png" />
                            <h5>1. Make Your Schedule and Export</h5>
                        </div>
                        <div class="carousel-item">
                            <img src="../assets/gcal2.png" />
                            <h5>2. Save The File Somewhere You Can Find</h5>
                        </div>
                        <div class="carousel-item">
                            <img src="../assets/gcal3.png" />
                            <h5>3. Go to Google Calendar</h5>
                        </div>
                        <div class="carousel-item">
                            <img src="../assets/gcal4.png" />
                            <h5>4. Click on Setting</h5>
                        </div>
                        <div class="carousel-item">
                            <img src="../assets/gcal5.png" />
                            <h5>5. Select Import & Export</h5>
                        </div>
                        <div class="carousel-item">
                            <img src="../assets/gcal6.png" />
                            <h5>6. Import Data Over Here</h5>
                        </div>
                        <div class="carousel-item">
                            <img src="../assets/gcal7.png" />
                            <h5>7. Find and Open The File You Just Saved</h5>
                        </div>
                        <div class="carousel-item">
                            <img src="../assets/gcal8.png" />
                            <h5>8. Import!</h5>
                        </div>
                        <div class="carousel-item">
                            <img src="../assets/gcal9.png" />
                            <h5>
                                9. Now You Can View Your Schedule On Google Calendar!
                            </h5>
                        </div>
                    </div>
                    <a
                        class="carousel-control-prev"
                        href="#googleCalendarInstruction"
                        role="button"
                        data-slide="prev"
                    >
                        <span class="carousel-control-prev-icon" aria-hidden="true"></span>
                        <span class="sr-only">Previous</span>
                    </a>
                    <a
                        class="carousel-control-next"
                        href="#googleCalendarInstruction"
                        role="button"
                        data-slide="next"
                    >
                        <span class="carousel-control-next-icon" aria-hidden="true"></span>
                        <span class="sr-only">Next</span>
                    </a>
                </div>
            </div>

            <h5 id="item-7-2"></h5>
            <p>...</p>
        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator';
import 'bootstrap';
import $ from 'jquery';

@Component
export default class Information extends Vue {
    @Prop(Number) readonly scheduleLeft!: number;
    mounted() {
        $('#myCarousel').carousel();
        $('body').scrollspy({ target: '#navbar-scrollspy' });
    }
}
</script>

<style scoped>
#info-panel {
    background-color: antiquewhite;
    /* background-color: rgb(244, 247, 248); */
}
#navbar-scrollspy {
    position: fixed;
}
.container > div {
    font-size: 20px;
    font-family: 'Times New Roman', Times, serif;
    margin-top: 1.5em;
}
.carousel-inner > .carousel-item > img {
    left: 10%;
    right: 10%;
    height: 30%;
    width: 100%;
}
</style>
