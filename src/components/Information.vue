<template>
    <div id="info-panel">
        <nav id="navbar-scrollspy" class="navbar d-block navbar-light bg-light sidebar">
            <a class="navbar-brand" href="#">Website Guide</a>
            <nav class="nav nav-pills flex-column">
                <a class="nav-link" href="#item-1">Introduction</a>
                <a class="nav-link" href="#item-2">Basic Operations</a>
                <nav class="nav nav-pills flex-column">
                    <a class="nav-link ml-3 my-1 py-1" href="#item-2-1">Schedule Manipulation</a>
                    <a class="nav-link ml-3 my-1 py-1" href="#item-2-2">Enroll in SIS</a>
                </nav>
                <a class="nav-link" href="#item-3">Add Event</a>
                <a class="nav-link" href="#item-4">Filters</a>
                <nav class="nav nav-pills flex-column">
                    <a class="nav-link ml-3 my-1 py-1" href="#item-4-1">No Class Time</a>
                    <a class="nav-link ml-3 my-1 py-1" href="#item-4-2">Allow Waitlist/Closed</a>
                    <a class="nav-link ml-3 my-1 py-1" href="#item-4-3">Sort</a>
                </nav>
                <!-- <a class="nav-link" href="#item-5">Display Settings</a> -->
                <a class="nav-link" href="#item-6">Customize Colors</a>
                <a class="nav-link" href="#item-7">Export</a>
                <nav class="nav nav-pills flex-column">
                    <a class="nav-link ml-3 my-1 py-1" href="#item-7-1">Export to iCalendar</a>
                    <a class="nav-link ml-3 my-1 py-1" href="#item-7-2">Export to JSON</a>
                </nav>
                <a class="nav-link" href="#item-8">Authors</a>
                <a class="nav-link" href="#item-9">Contributing</a>
                <a class="nav-link" href="#item-10">Disclaimer</a>
                <a class="nav-link" href="#item-11">Appendix</a>
                <nav class="nav nav-pills flex-column">
                    <a class="nav-link ml-3 my-1 py-1" href="#item-11-1">Sort</a>
                </nav>
            </nav>
        </nav>
        <div
            style="margin-right: 5vw;margin-top: 5vh; font-size: 15px;"
            :style="{
                'margin-left': scheduleLeft + 5 + 'vw'
            }"
            data-spy="scroll"
            data-target="#navbar-scrollspy"
            data-offset="10"
        >
            <h2 id="item-1">Welcome to our information page! Meow~</h2>
            <p>
                This website helps UVa students to schedule their classes more efficiently. Get your
                class selection done with the searching field and customize them with filters. The
                website can generate all possible schedules according to your requirements.
            </p>
            <p>
                <strong
                    >Important note: It is recommended that you save the schedule after you finish
                    (see <a href="#item-7-2">Export to JSON</a>, or
                    <a href="#item-7-1">Export to iCalender</a>), because our website uses your
                    browser cache to store data, which could be lost if it expires or the cache is
                    cleared.
                </strong>
            </p>
            <h3 id="item-2">Basic Operations</h3>
            <hr />
            <div id="item-2-1" style="width:100%;height:2px"></div>
            <v-layout class="mb-4">
                <v-flex xs8 sm4 class="mr-4">
                    <v-card>
                        <v-img :src="imgPath('search_class.png')" aspect-ratio="1.6"></v-img>

                        <v-card-title primary-title>
                            <div>
                                <h5 class="headline mb-3">Add Courses</h5>
                                <div>
                                    You can add courses by
                                    <font class="amber lighten-3">searching</font> department,
                                    professor, class number, or keywords. Pick a section or multiple
                                    sections that you want to take, or choose "<font
                                        class="amber lighten-3"
                                        >any section</font
                                    >" if you don't have a particular preference. To clear your
                                    search query, press <font class="amber lighten-3">ESC</font> or
                                    click on the <i class="fas fa-times click-icon"> </i> button at
                                    the right end of the search box.
                                </div>
                            </div>
                        </v-card-title>
                    </v-card>
                </v-flex>
                <v-flex xs8 sm4 class="mr-4">
                    <v-card>
                        <v-img :src="imgPath('generate_schedule.png')" aspect-ratio="1.6"></v-img>

                        <v-card-title primary-title>
                            <div>
                                <h5 class="headline mb-3">Generate Schedules</h5>
                                <div>
                                    After you have finished selecting your courses, you can hit the
                                    <font class="lime lighten-3">generate</font> button to generate
                                    all possibles schedules out of the sections you selected. You
                                    can switch between the generated schedule and your current
                                    selection by clicking the "<font class="lime lighten-3"
                                        >edit class</font
                                    >/<font class="lime lighten-3">view schedule</font>" button
                                    below the search bar.
                                </div>
                            </div>
                        </v-card-title>
                    </v-card>
                </v-flex>
                <v-flex xs8 sm4>
                    <v-card>
                        <v-img :src="imgPath('multiple_schedule.png')" aspect-ratio="1.6"></v-img>

                        <v-card-title primary-title>
                            <div>
                                <h5 class="headline mb-3">Multiple Schedules</h5>
                                <div>
                                    You can plan multiple schedules at the same time. Click the
                                    <i class="far fa-calendar-plus click-icon teal lighten-4"></i>
                                    icon, you will have a new empty schedule independent with your
                                    existing schedules. Click
                                    <i class="fas fa-long-arrow-alt-left teal lighten-4"></i> or
                                    <i class="fas fa-long-arrow-alt-right teal lighten-4"></i>
                                    to navigate through your schedules. Use
                                    <i class="far fa-copy click-icon teal lighten-4"></i> to make a
                                    copy of the current scheudle, and use
                                    <i class="far fa-calendar-times teal lighten-4"></i> delete the
                                    current schedule.
                                </div>
                            </div>
                        </v-card-title>
                    </v-card>
                </v-flex>
            </v-layout>
            <h5>Add Classes</h5>
            <v-card class="my-4 mx-auto" style="width:85%">
                <v-img :src="imgPath('select_class.gif')"></v-img>
            </v-card>
            <h5>Generate Schedules</h5>
            <v-card class="my-4 mx-auto" style="width:85%">
                <v-img :src="imgPath('generate_class.gif')"></v-img>
            </v-card>
            <h5>Multiple Schedules</h5>
            <v-card class="my-4 mx-auto" style="width:85%">
                <v-img :src="imgPath('multiple_schedule.gif')"></v-img>
            </v-card>

            <h5 id="item-2-2">Enroll in SIS</h5>
            <p>
                For convenience, we provide a list of course IDs for your currently active schedule
                at the bottom left corner under "Schedule Overview" (can be seen clearly in the GIFs
                shown above). These IDs can be direcly entered into SIS, through the input box left
                to your shopping cart.
            </p>
            <v-card class="my-3 mx-auto" style="width:85%">
                <v-img :src="imgPath('enroll-sis.png')"></v-img>
            </v-card>
            <p>
                If some of the IDs are missing, it may because you are in "Edit class" mode and you
                selected "Any section" for that course. If there is a "+1" (or a higher number)
                after an ID, it means that course has more than one sections available at the given
                time shown in your schedule. To view the list of sections, click the corresponding
                course block rendered in the grid. For example, in the schedule shown below, there
                are four available ENWR 1510 at Monday and Wednesday 5:00 to 6:15PM.
            </p>
            <v-card class="mt-3 mb-5 mx-auto" style="width:85%">
                <v-img :src="imgPath('multi-section.png')"></v-img>
            </v-card>

            <h3 id="item-3">Add Event</h3>
            <hr />
            <p>
                This feature allows you to customize your own schedule. You can add your weekly
                commitments on the schedule, such as club meetings, office hours, etc. The schedule
                generator will generate schedules that do not conflict with your event. However, if
                it is not possible to find such a schedule, an error will be thrown.
            </p>
            <v-card class="my-5 mx-auto" style="width:85%;">
                <v-img :src="imgPath('add_event.gif')"></v-img>
            </v-card>
            <h3 id="item-4">Filters</h3>
            <hr />
            <p>
                Filters allow you to set parameters to better navigate your searches and generate
                your schedules
            </p>
            <h5 id="item-4-1">No Class Time</h5>
            <p>
                You can select time and day at which you do not wish to have class.
            </p>
            <v-card class="my-4 mx-auto" style="width:85%;">
                <v-img :src="imgPath('no-class-time.gif')"></v-img>
            </v-card>
            <h5 id="item-4-2">Allow Waitlist/Closed</h5>
            <p>
                You can choose to include or exclude wait list or closed sections by ticking these
                two checkboxes.
            </p>
            <h5 id="item-4-3">Sort Schedules</h5>
            <p>
                One powerful feature comes with auto-scheduling is that the generated schedules can
                be sorted based on one or a combination of options. You can select multiple sort
                options to optimize your schedule, and drag sort options to change their priority in
                fallback mode. Note that all of the sort options are responsive, i.e. they will be
                applied instantly after your changes.
            </p>
            <h6>Sort Options</h6>
            Currently, we provide the following list of sort options. If you prefer a mathematical
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
                <li>Combined: Combine all sorting options enabled and give them equal weight</li>
                <li>
                    Fallback: Sort using the options on top first. If two schedules are compared
                    equal using that option, sort using the next option.
                </li>
            </ol>
            <h6>Tips on chosing sort modes</h6>
            If you want to balance between multiple sort options, try "combined". On the other hand,
            if you want to prioritize a single sort option (such as No Early), then try "fallback",
            as it will sort using options on top first.

            <v-card class="my-5 mx-auto" style="width:85%">
                <v-img :src="imgPath('sort.gif')"></v-img>
            </v-card>

            <!-- <h3 id="item-5">Display Settings</h3>
            <hr /> -->
            <h3 id="item-6">Customize Colors</h3>
            <hr />
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
            <hr />
            <h5 id="item-7-1">Export to iCalendar</h5>
            <p>
                ICalendar is a standard file format used to represent information in a calednar.
                Apple and Google calendar both support importing from iCalendar files. Note that we
                currently do NOT support importing from iCalendar files. If you want to re-import
                your schedule sometime later, you must use <a href="#item-7-2">export to JSON</a>.
            </p>
            <p>
                The instruction on how to export your schedule to a iCalendar file and import it to
                your Google calendar is shown below.
            </p>
            <v-stepper v-model="e2" class="my-5 mx-auto" style="width:60vw;">
                <v-stepper-header>
                    <v-stepper-step
                        v-for="(step, idx) in icalSteps"
                        :key="idx"
                        :complete="e2 > +idx"
                        :step="idx"
                        style="margin:auto auto;cursor:pointer"
                        color="blue-grey"
                        @click="e2 = +idx"
                    ></v-stepper-step>
                </v-stepper-header>

                <v-stepper-items>
                    <v-stepper-content v-for="(step, idx) in icalSteps" :key="idx" :step="idx">
                        <v-card class="mb-2 mx-auto" width="54vw">
                            <v-img :src="icalSteps[idx].src" aspect-ratio="2.37"></v-img>
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
            <div class="row">
                <div class="col col-7">
                    You can export your schedule to a JSON file (a file that ends with .json) so
                    that it can be re-imported later. It is a dedicated file format that we use to
                    store information in your schedule, so it could only be used on our website.
                </div>
                <div class="col col-md-auto">
                    <img :src="imgPath('export-json.png')" width="240px" alt="export to json" />
                </div>
            </div>

            <h3 id="item-8">Authors</h3>
            <hr />
            <p>The primiary contributors of this website are</p>
            <ol>
                <li>Hanzhi Zhou</li>
                <li>Kaiying Shan <s>(non-human; cat)</s></li>
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

            <h3 id="item-9">Contributing</h3>
            <hr />
            <p>
                Our website is completely free and open course under the GPL-v3 license. Our source
                code is
                <a href="https://github.com/awesome-schedule/Awesome-SchedulAR"
                    >available at GitHub</a
                >, and we welcome contribution of any kind.
            </p>

            <h3 id="item-10">Disclaimer</h3>
            <hr />
            <p>
                Although we have made as much effort as we can to ensure that our website is
                functional and provides correct information, we do not hold any liability for that.
                This is explicitly covered under the
                <a
                    href="https://github.com/awesome-schedule/Awesome-SchedulAR/blob/f56d510b09dbd8abd72314f4d4856f69658f5487/LICENSE#L600"
                    >GPL license </a
                >.
            </p>
            <p>
                The only authentic source of course data is the Student Information System (SIS).
                For your benefit, it is recommended that you put your courses in the shopping cart
                in SIS as soon as you have finished selecting your schedules and check whether the
                meeting times are consistent with that shown on our website. If you find any
                inconsistency, please email to
                <a href="mailto:zh2wc@virginia.edu">zh2wc@virginia.edu</a> or
                <a href="mailto:hz2zz@virginia.edu">hz2zz@virginia.edu</a> and open an issue on our
                GitHub immediately.
            </p>

            <h3 id="item-11">Appendix</h3>
            <hr />
            <h5 id="item-11-1">Calculation of Sort Indicators</h5>
            <div class="mt-2 mb-4">
                For each schedule, a single/array of coefficients are calculated, depending on the
                sort options enabled. The following formulae provide an overview on how these
                coefficients are calculated. To know exactly how they are implemented, please refer
                to
                <a
                    href="https://github.com/awesome-schedule/Awesome-SchedulAR/blob/master/src/algorithm/ScheduleEvaluator.ts"
                >
                    our code</a
                >.
            </div>
            <vue-mathjax :formula="formula.compactness"></vue-mathjax>
            <div class="py-4 my-4" style="height: 500px;"></div>
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
            src: this.imgPath('export1.png')
        },
        2: {
            title: 'Save The File Somewhere You Can Find',
            src: this.imgPath('export2.png')
        },
        3: {
            title: 'Go to Google Calendar',
            src: this.imgPath('export3.png')
        },
        4: {
            title: 'Click on Setting',
            src: this.imgPath('export4.png')
        },
        5: {
            title: 'Select Import and Export',
            src: this.imgPath('export5.png')
        },
        6: {
            title: 'Find and Open The File You Just Saved',
            src: this.imgPath('export6.png')
        },
        7: {
            title: 'Import',
            src: this.imgPath('export7.png')
        },
        8: {
            title: 'Import Successful!',
            src: this.imgPath('export8.png')
        },
        9: {
            title: 'Now You Can View Your Schedule On Google Calendar!',
            src: this.imgPath('export9.png')
        }
    };

    mounted() {
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
</style>
