<template>
    <div id="info-panel">
        <nav id="navbar-scrollspy" class="navbar d-block navbar-light bg-light sidebar">
            <a class="navbar-brand" href="#">Website Guide</a>
            <nav class="nav nav-pills flex-column">
                <a class="nav-link" href="#item-1">Introduction</a>
                <a class="nav-link" href="#item-2">Basic Operations</a>
                <nav class="nav nav-pills flex-column">
                    <a class="nav-link ml-3 my-1" href="#item-2-1">Add Courses</a>
                    <a class="nav-link ml-3 my-1" href="#item-2-2">Generate schedules</a>
                    <a class="nav-link ml-3 my-1" href="#item-2-3">Multiple sets of courses</a>
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
                <a class="nav-link" href="#item-7">Export</a>
                <nav class="nav nav-pills flex-column">
                    <a class="nav-link ml-3 my-1" href="#item-7-1">Export to iCalendar</a>
                    <a class="nav-link ml-3 my-1" href="#item-7-2">Export to JSON</a>
                </nav>
                <a class="nav-link" href="#item-8">Authors</a>
                <a class="nav-link" href="#item-9">Appendix</a>
                <nav class="nav nav-pills flex-column">
                    <a class="nav-link ml-3 my-1" href="#item-9-1">Sort</a>
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
                This website helps UVa students to schedule their classes more efficiently. Get your
                class selection done with the searching field and customize them with filters. The
                website can generate all possible schedules according to your requirements.
            </p>
            <p>
                <strong
                    >Important note: It is recommended that you save your calendar frequently (see
                    <a href="#item-7-2">Export to JSON</a>), because our website saves all its data
                    in your browser, locally. If the data expired or you cleared your cache, the
                    data will be permanently lost!
                </strong>
            </p>
            <h3 id="item-2">Basic Operations</h3>
            <div class="about-border"></div>
            <h5 id="item-2-1">Add Courses</h5>
            <p>
                You can add courses by searching department, professor, class number, or keywords.
                Pick a section or multiple sections that you want to take, or choose "Any Section"
                if you don't have a particular preference. To clear your search query, press ESC or
                click on the delete button at the right end of the search box.
                <!-- After you finished adding, you can edit class list under "Edited Classes". -->
            </p>
            <h5 id="item-2-3">Generate schedules</h5>
            <p>
                After you have finished selecting your courses, you can hit the generate button to
                generate all possibles schedules out of the sections you selected. You can switch
                between the generated schedule and your current selection by clicking the "Edit
                Class/View Schedule" button below the search bar.
            </p>
            <h5 id="item-2-3">Multiple sets of courses</h5>
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
                        >Name of step 1
                    </v-stepper-step>

                    <v-divider></v-divider>

                    <v-stepper-step :complete="e1 > 2" step="2" color="blue-grey "
                        >Name of step 2
                    </v-stepper-step>

                    <v-divider></v-divider>

                    <v-stepper-step :complete="e1 > 3" step="3" color="blue-grey "
                        >Name of step 3
                    </v-stepper-step>
                </v-stepper-header>

                <v-stepper-items>
                    <v-stepper-content step="1">
                        <v-card class="mb-5" width="54vw" style="margin:auto auto">
                            <v-img :src="imgPath('placeholder.png')" aspect-ratio="1.7778"></v-img>
                        </v-card>

                        <v-btn color="blue-grey" style="color:white" @click="e1 = 2">
                            Continue
                        </v-btn>
                    </v-stepper-content>

                    <v-stepper-content step="2">
                        <v-card class="mb-5" width="54vw" style="margin:auto auto">
                            <v-img :src="imgPath('placeholder.png')" aspect-ratio="1.7778"></v-img>
                        </v-card>

                        <v-btn color="blue-grey" style="color:white" @click="e1 = 3">
                            Continue
                        </v-btn>
                    </v-stepper-content>

                    <v-stepper-content step="3">
                        <v-card class="mb-5" width="54vw" style="margin:auto auto">
                            <v-img :src="imgPath('placeholder.png')" aspect-ratio="1.7778"></v-img>
                        </v-card>

                        <v-btn color="blue-grey" style="color:white" @click="e1 = 1"
                            >Play Again</v-btn
                        >
                    </v-stepper-content>
                </v-stepper-items>
            </v-stepper>

            <h3 id="item-3">Add Event</h3>
            <div class="about-border"></div>
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
            <div class="about-border"></div>
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
            <h5 id="item-4-3">Sort Schedules</h5>
            <p>
                One powerful feature comes with auto-scheduling is that we can sort the generated
                schedules based on one of a combination of indicators. You can select multiple
                indicators to optimize your schedule, and drag sort options to change their priority
                in fallback mode.
            </p>
            <h6>Sort Options</h6>
            Currently, we provide the following list of sort options. If you want a mathematical
            description on how they are computed, see <a href="#item-8-1">Appendix</a>.
            <ol>
                <li>Variance: Balance the class time each day</li>
                <li>Vertical compactness: Make classes back-to-back</li>
                <li>Lunch Time: Leave spaces for lunch</li>
                <li>No Early: Start the day as late as possible</li>
                <li>Walking Distance: Avoid long distance walking between classes</li>
                <li>I'm Feeling Lucky: Sort Randomly</li>
            </ol>
            <h6>Sort Modes</h6>
            And there are two avaiable sort modes.
            <ol>
                <li>Combined: Combine all sorting options enabled and given them equal weight</li>
                <li>
                    Fallback: Sort using the options on top first. If two schedules are compared
                    equal using that option, sort using the next option.
                </li>
            </ol>
            <h6>Tips on chosing sort modes</h6>
            If you want to balance between multiple sort options, try "combined". On the other hand,
            if you want to prioritize a single sort option (such as No Early), then try "fallback",
            as it will sort using options on top first.

            <v-card class="my-5" style="width:85%;margin:auto auto">
                <v-img :src="imgPath('Sort.gif')"></v-img>
            </v-card>

            <h3 id="item-5">Display Settings</h3>
            <div class="about-border"></div>
            <h3 id="item-6">Customize Colors</h3>
            <div class="about-border"></div>
            <p>
                You can switch to the Palette (<i class="fas fa-palette"></i>) to customize the
                background colors of courses and events. You can either click the
                <i class="fas fa-sync-alt mr-1"></i> icon to use a random color or click
                <input type="color" style="width: 30px" value="#deadbb" /> to select your favorite
                color. If you find that there are courses missing from the palette, it may because
                you selected "Any Section" for that course and did not switch to "View Schedule"
                mode.
            </p>
            <h3 id="item-7">Export</h3>
            <div class="about-border"></div>
            <h5 id="item-7-1">Export to iCalendar</h5>
            <p>
                ICalendar is a standard file format used to represent information in a calednar.
                Apple and Google calendar both support importing from iCalendar. Our website can
                export your schedule to a iCalendar file. The instruction on how to import iCalendar
                file to your Google calendar is shown below:
            </p>
            <v-stepper v-model="e2" class="my-5" style="width:60vw;margin:auto auto">
                <v-stepper-header>
                    <v-stepper-step
                        v-for="(step, idx) in icalSteps"
                        :key="idx"
                        :complete="e2 > idx"
                        :step="idx"
                        style="margin:auto auto"
                        color="blue-grey"
                    ></v-stepper-step>
                </v-stepper-header>

                <v-stepper-items>
                    <v-stepper-content v-for="(step, idx) in icalSteps" :key="idx" :step="idx">
                        <v-card class="mb-2" width="54vw" style="margin:auto auto">
                            <v-img :src="icalSteps[idx].src" aspect-ratio="1.7778"></v-img>
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
                            >{{ e2 === 9 ? 'Play Again' : 'Continue' }}
                        </v-btn>
                        <v-btn v-if="e2 !== 1" color="blue-grey" style="color:white" @click="e2--">
                            Back
                        </v-btn>
                    </v-stepper-content>
                </v-stepper-items>
            </v-stepper>

            <h5 id="item-7-2">Export to JSON</h5>
            <p>
                You can export your schedule to a JSON file so that it can be re-imported later.
            </p>
            <h3 id="item-8">Authors</h3>
            <p>The primiary contributors of this website are</p>
            <ol>
                <li>Hanzhi Zhou</li>
                <li>Kaiying Shan</li>
                <li>Zichao Hu</li>
                <li>Minjun Long</li>
            </ol>
            <p>
                For more details, please refer to our
                <a
                    href="https://github.com/awesome-schedule/Awesome-SchedulAR/blob/master/docs/Contribution.md"
                >
                    contribution log
                </a>
            </p>

            <h3 id="item-9">Appendix</h3>
            <h5 id="item-9-1">Calculation of Sort Indicators</h5>
            For each schedule, a single/array of coefficients are calculated, depending on the sort
            options enabled. The following formulae provide an overview on how these coefficients
            are calculated. To know exactly how they are implemented, please refer to
            <a
                href="https://github.com/awesome-schedule/Awesome-SchedulAR/blob/master/src/algorithm/ScheduleEvaluator.ts"
            >
                our code</a
            >.
            <vue-mathjax :formula="formula.compactness"></vue-mathjax>
            <div class="py-4 my-4" style="height: 1000px;"></div>
        </div>
    </div>
</template>

<script lang="ts">
// tslint:disable:max-line-length
import { Vue, Component, Prop } from 'vue-property-decorator';
import { VueMathjax } from 'vue-mathjax';
import 'bootstrap';
import $ from 'jquery';

@Component({
    components: {
        VueMathjax
    }
})
export default class Information extends Vue {
    @Prop(Number) readonly scheduleLeft!: number;

    e1: number = 0;
    e2: number = 1;
    formula = {
        compactness: `
$$
\\begin{align*}
    \\text{Variance}    & = \\sum_{day=\\text{Monday}}^{\\text{Friday}}
    \\frac{\\text{Classtime}(day)^2}{5} - \\left( \\sum_{day=\\text{Monday}}^{\\text{Friday}} \\frac{\\text{Classtime}(day)}{5} \\right)^2                             \\\\
    \\text{Compactness} & = \\sum_{day=\\text{Monday}}^{\\text{Friday}} \\sum_{i = 1}^{n_{day} - 1} \\left(\\text{Start}_{i + 1} - \\text{End}_{i} \\right)            \\\\
                       & \\text{where $n_{day}$ is the number of classes at day $day$}                                                                         \\\\
    \\text{No Early}    & = \\sum_{day=\\text{Monday}}^{\\text{Friday}} \\text{12:00} - \\text{FirstClassStart}                                                     \\\\
    \\text{Lunch time}  & = \\sum_{day=\\text{Monday}}^{\\text{Friday}} \\sum_{i = 1}^{n_{day}} \\min(\\text{OverlapBetween}(\\text{Class}_i, \\text{Lunch}), 60) - 60 \\\\
                       & \\text{where Lunch is defined as the time between 11:00 and 14:00}                                                                    \\\\
    \\text{Distance}    & = \\sum_{day=\\text{Monday}}^{\\text{Friday}} \\sum_{i = 1}^{n_{day} - 1} \\text{DistanceBetween}(\\text{Class}_i, \\text{Class}_{i+1})
\\end{align*}
$$
        `
    };

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

.about-border {
    display: block;
    width: auto;
    height: 3px;
    background: #f1cd8f;
    margin: 5px auto 20px auto;
}
</style>
