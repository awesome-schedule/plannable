<template>
    <div id="info-panel">
        <nav id="navbar-scrollspy" class="navbar d-block navbar-light bg-light sidebar">
            <a class="navbar-brand" href="#">Website Guide</a>
            <nav class="nav nav-pills flex-column">
                <a class="nav-link" href="#item-1">Introduction</a>
                <a class="nav-link" href="#item-2">Basic Operations</a>
                <nav class="nav nav-pills flex-column">
                    <a class="nav-link ml-3 my-1" href="#item-2-1">Add Courses</a>
                    <a class="nav-link ml-3 my-1" href="#item-2-2">Multiple set of class</a>
                </nav>
                <a class="nav-link" href="#item-3">Add Event</a>
                <a class="nav-link" href="#item-4">Filters</a>
                <nav class="nav nav-pills flex-column">
                    <a class="nav-link ml-3 my-1" href="#item-4-1">No Class Time</a>
                    <a class="nav-link ml-3 my-1" href="#item-4-2">Allow Waitlist/Closed</a>
                    <a class="nav-link ml-3 my-1" href="#item-4-3">Sort</a>
                </nav>
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
            :style="{
                'margin-left': scheduleLeft + 5 + 'vw',
                'margin-right': '5vw',
                'margin-top': '5vh'
            }"
            data-spy="scroll"
            data-target="#navbar-scrollspy"
            data-offset="10"
        >
            <h2 id="item-1">Welcome to our information page!</h2>
            <p>
                This is a website which helps UVa students to schedule their classes more
                efficiently. Get your class selection done with the searching field and customize
                them with filters. The website can generate all possible schedules according to your
                requirements.
            </p>
            <h3 id="item-2">Basic Operations</h3>
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

            <v-stepper v-model="e1" class="my-5" style="width:60vw;margin:auto auto">
                <v-stepper-header>
                    <v-stepper-step :complete="e1 > 1" step="1" color="blue-grey "
                        >Name of step 1</v-stepper-step
                    >

                    <v-divider></v-divider>

                    <v-stepper-step :complete="e1 > 2" step="2" color="blue-grey "
                        >Name of step 2</v-stepper-step
                    >

                    <v-divider></v-divider>

                    <v-stepper-step :complete="e1 > 3" step="3" color="blue-grey "
                        >Name of step 3</v-stepper-step
                    >
                </v-stepper-header>

                <v-stepper-items>
                    <v-stepper-content step="1">
                        <v-card class="mb-5" height="468px" width="54vw" style="margin:auto auto">
                            <v-img :src="imgPath('placeholder.png')"></v-img>
                        </v-card>

                        <v-btn color="blue-grey" style="color:white" @click="e1 = 2">
                            Continue
                        </v-btn>
                    </v-stepper-content>

                    <v-stepper-content step="2">
                        <v-card class="mb-5" height="468px" width="54vw" style="margin:auto auto">
                            <v-img :src="imgPath('placeholder.png')"></v-img>
                        </v-card>

                        <v-btn color="blue-grey" style="color:white" @click="e1 = 3">
                            Continue
                        </v-btn>
                    </v-stepper-content>

                    <v-stepper-content step="3">
                        <v-card class="mb-5" height="468px" width="54vw" style="margin:auto auto">
                            <v-img :src="imgPath('placeholder.png')"></v-img>
                        </v-card>

                        <v-btn color="blue-grey" style="color:white" @click="e1 = 1">
                            Play Again
                        </v-btn>
                    </v-stepper-content>
                </v-stepper-items>
            </v-stepper>

            <h3 id="item-3">Add Event</h3>
            <p>
                This feature allows you to customize your own schedule. You can add your weekly
                commitments on the schedule, such as club meetings, office hours, etc. This feature
                is similar to any other calendar which later you can sync it with your personal
                calender on google or apple.
            </p>
            <v-card class="my-5" style="width:85%;margin:auto auto;">
                <v-img :src="imgPath('AddEvent.gif')"></v-img>
            </v-card>
            <h3 id="item-4">Filters</h3>
            <p>
                Filters allow you to set parameters to better navigate your searches and generate
                your schedules
            </p>
            <h5 id="item-4-1">No Class Time</h5>
            <p>
                You can select time and day at which you do not wish to have class. The input form
                of time is 08:00:AM.
            </p>
            <v-card class="my-5" style="width:85%;margin:auto auto;">
                <v-img :src="imgPath('NoClassTime.gif')"></v-img>
            </v-card>
            <h5 id="item-4-2">Allow Waitlist/Closed</h5>
            <p>
                By checking on those two buttons, it allows the scheduler to consider the classes
                when auto-generating schedules even though it may no longer be available. Or you can
                uncheck it to enable the scheduler to auto-generate classes in realistic scenario.
            </p>
            <h5 id="item-4-3">Sort</h5>
            <p>
                One powerful feature comes with auto-scheduling is that the scheduler will generate
                the schedules for you based on your preference.
            </p>

            <v-card class="my-5" style="width:85%;margin:auto auto">
                <v-img :src="imgPath('Sort.gif')"></v-img>
            </v-card>

            <h3 id="item-5">Display Settings</h3>
            <h3 id="item-5">Customize Colors</h3>
            <h3 id="item-7">Export ICalendar</h3>
            <p>
                ICalendar is a standard file which you can import to your Apple/Google Calendar.
                This website allows you to download the ICalendar to your computer after you have
                creatd your schedule. Then, you can go to your Apple/Google Calendar and then
                syncronize your schedule. Instruction is shown below:
            </p>
            <h5 id="item-7-1">Google Calendar</h5>
            <v-stepper v-model="e2" class="my-5" style="width:60vw;margin:auto auto">
                <v-stepper-header>
                    <v-stepper-step
                        v-for="(step, idx) in icalSteps"
                        :key="idx"
                        :complete="e2 > idx"
                        :step="idx"
                        style="margin:auto auto"
                        color="blue-grey"
                    >
                        {{ idx }}</v-stepper-step
                    >
                </v-stepper-header>

                <v-stepper-items>
                    <v-stepper-content v-for="(step, idx) in icalSteps" :key="idx" :step="idx">
                        <v-card class="mb-2" height="468px" width="54vw" style="margin:auto auto">
                            <v-img :src="icalSteps[idx].src"></v-img>
                        </v-card>
                        <v-card-title class="mb-2" primary-title>
                            <div>
                                <div>{{ step.title }}</div>
                            </div>
                        </v-card-title>
                        <v-btn
                            color="blue-grey"
                            style="color:white"
                            @click="e2 !== 9 ? e2++ : (e2 = 1)"
                        >
                            {{ e2 === 9 ? 'Play Again' : 'Continue' }}
                        </v-btn>
                    </v-stepper-content>
                </v-stepper-items>
            </v-stepper>

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

    e1: number = 0;
    e2: number = 0;

    icalSteps = {
        1: {
            title: 'Make Your Schedule and Export',
            src: this.imgPath('gcal1.png')
        },
        2: {
            title: 'Save The File Somewhere You Can Find',
            src: this.imgPath('gcal2.png')
        },
        3: {
            title: 'Go to Google Calendar',
            src: this.imgPath('gcal3.png')
        },
        4: {
            title: 'Click on Setting',
            src: this.imgPath('gcal4.png')
        },
        5: {
            title: 'Select import and export',
            src: this.imgPath('gcal5.png')
        },
        6: {
            title: 'Import Data Over Here',
            src: this.imgPath('gcal6.png')
        },
        7: {
            title: 'Find and Open The File You Just Saved',
            src: this.imgPath('gcal7.png')
        },
        8: {
            title: 'Import!',
            src: this.imgPath('gcal8.png')
        },
        9: {
            title: 'Now You Can View Your Schedule On Google Calendar!',
            src: this.imgPath('gcal9.png')
        }
    };

    mounted() {
        $('#myCarousel').carousel();
        $('body').scrollspy({ target: '#navbar-scrollspy' });
    }

    imgPath(name: string) {
        return require('../assets/' + name);
    }
}
</script>

<style scoped>
#info-panel {
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
.GIF {
    left: 10%;
    right: 10%;
    height: auto;
    width: 100%;
    position: center;
}
</style>
