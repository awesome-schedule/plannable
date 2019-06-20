<template>
    <div id="info-panel">
        <nav id="navbar-scrollspy" class="navbar d-block navbar-light bg-light sidebar">
            <div class="navbar-brand" @click="showGuide(0)">User Guide</div>
            <!-- 0 is show all -->
            <nav class="nav nav-pills flex-column">
                <div @click="showGuide(1)">
                    <a class="nav-link" href="#item-1" @click="showGuide(1)">Introduction</a>
                    <nav class="nav nav-pills flex-column">
                        <a class="nav-link ml-3 my-1 py-1" href="#item-1-1"
                            >Intro to Auto-Scheduling</a
                        >
                        <a class="nav-link ml-3 my-1 py-1" href="#item-1-2"
                            >Planned vs. Generated</a
                        >
                        <a class="nav-link ml-3 my-1 py-1" href="#item-1-3">Website Info</a>
                    </nav>
                </div>
                <div @click="showGuide(2)">
                    <a class="nav-link" href="#item-2">
                        <i class="far fa-calendar-alt"></i> A Quick Start</a
                    >
                    <nav class="nav nav-pills flex-column">
                        <a class="nav-link ml-3 my-1 py-1" href="#item-2-0">Course Searching</a>
                        <a class="nav-link ml-3 my-1 py-1" href="#item-2-1"
                            >Schedule Manipulation</a
                        >
                        <a class="nav-link ml-3 my-1 py-1" href="#item-2-2">Schedule Rendering</a>
                        <a class="nav-link ml-3 my-1 py-1" href="#item-2-3">Enroll in SIS</a>
                    </nav>
                </div>
                <div @click="showGuide(3)">
                    <a class="nav-link" href="#item-3"
                        ><i class="fab fa-elementor"></i> Add Event</a
                    >
                </div>
                <div @click="showGuide(4)">
                    <a class="nav-link" href="#item-4"><i class="fas fa-filter"></i> Filters</a>
                    <nav class="nav nav-pills flex-column">
                        <a class="nav-link ml-3 my-1 py-1" href="#item-4-1">No Class Time</a>
                        <a class="nav-link ml-3 my-1 py-1" href="#item-4-2"
                            >Allow Waitlist/Closed</a
                        >
                        <a class="nav-link ml-3 my-1 py-1" href="#item-4-3">Sort Options</a>
                    </nav>
                </div>
                <!-- <a class="nav-link" href="#item-5">Display Settings</a> -->
                <div @click="showGuide(6)">
                    <a class="nav-link" href="#item-6"
                        ><i class="fas fa-palette"></i> Customize Colors
                    </a>
                </div>
                <div @click="showGuide(7)">
                    <a class="nav-link" href="#item-7">
                        <i class="fas fa-download"></i> Import and Export</a
                    >
                    <nav class="nav nav-pills flex-column">
                        <a class="nav-link ml-3 my-1 py-1" href="#item-7-1">Export to iCalendar</a>
                        <a class="nav-link ml-3 my-1 py-1" href="#item-7-2">JSON Import/Export</a>
                    </nav>
                </div>
                <div @click="showGuide(9)">
                    <a class="nav-link" href="#item-9">Contributing</a>
                    <nav class="nav nav-pills flex-column">
                        <a class="nav-link ml-3 my-1 py-1" href="#item-9-1">Contact Authors</a>
                        <a class="nav-link ml-3 my-1 py-1" href="#item-9-2">Bug Reports</a>
                    </nav>
                </div>
                <div @click="showGuide(9)">
                    <a class="nav-link" href="#item-10">Disclaimer</a>
                </div>
                <div @click="showGuide(9)">
                    <a class="nav-link" href="#item-11">Appendix</a>
                    <nav class="nav nav-pills flex-column">
                        <a class="nav-link ml-3 my-1 py-1" href="#item-11-1">Sort Options</a>
                        <a class="nav-link ml-3 my-1 py-1" href="#item-11-2"
                            >Browser Compacitility</a
                        >
                        <a class="nav-link ml-3 my-1 py-1" href="#item-11-3">Source of Data</a>
                    </nav>
                    <a href="" class="mt-5"></a>
                </div>
            </nav>
        </nav>
        <div
            id="info-content"
            :style="{
                'margin-left': scheduleLeft + 5 + 'vw'
            }"
        >
            <div v-if="selected === 1 || !selected">
                <h2 id="item-1">Welcome to our information page! Meow~</h2>
                <hr />
                <p>
                    <small class="text-muted">
                        Page layout by Kaiying Shan, text by Hanzhi Zhou, media by Zichao Hu
                    </small>
                </p>
                <p>
                    This website helps UVa students to schedule their classes more efficiently. Get
                    your class selection done with the searching field and customize them with
                    filters. The website can generate all possible schedules according to your
                    requirements.
                </p>
                <p>
                    <strong
                        >Important note: It is recommended that you save the schedule after you
                        finish (see <a href="#item-7-2">Export to JSON</a>, or
                        <a href="#item-7-1">Export to iCalendar</a>), because our website uses your
                        browser cache to store data, which could be lost if it expires or the cache
                        is cleared. If you find any problem when using our website, please first
                        check whether you are using a compatible browser (see
                        <a href="#item-11-2">browser compatibility</a>). If it is not a problem with
                        your browser, please consider <a href="#item-9-2">submitting a bug report</a>.
                    </strong>
                </p>
                <p>
                    <strong>TL; DR</strong><br />
                    We provide tooltips containing brief descriptions for most buttons and icons
                    (place your mouse over them for a while and you will see). You are welcome to
                    skip this guide 😏
                </p>

                <h4 id="item-1-1">Introduction to Auto-Scheduling</h4>
                <!-- <hr /> -->
                <p>
                    Before the invention of auto-scheduling, we have to pick course sections that we
                    want to take and come up with a schedule. Due to the availability of multiple
                    sections, there may exist up to millions of possible schedules (e.g. 10 sections
                    per course and 7 courses in total, considering conflict). It is difficult to
                    both enumerate schedules by hand and come up with an optimal schedule. This is
                    where auto-scheduling comes in. It basically allows you to just provide a list
                    of courses with undetermined or partially determined sections, and it will do
                    the rest of the hard work for you.
                </p>

                <h4 id="item-1-2">Planned vs. Generated Schedules</h4>
                <div>
                    <div class="ml-2 float-right text-center">
                        <figure>
                            <img :src="imgPath('edit-class.png')" width="210px" />
                            <figcaption>Edit Class Mode</figcaption>
                        </figure>
                        <figure>
                            <img :src="imgPath('view-schedule.png')" width="210px" />
                            <figcaption>View Schedule Mode</figcaption>
                        </figure>
                    </div>
                    <div>
                        <p>
                            You need to be aware of the fact that you are manipulating two sets of
                            schedules on the same interface: Planned schedules (sometimes also
                            referred as proposed schedules) and generated schedules. Planned
                            schedules are what you provide to the auto-scheduler as input. Generated
                            schedules are the outputs of the scheduler.
                        </p>
                        <p>
                            To differentiate these two sets of schedules, we provide two edit modes:
                            Edit Class mode and View Schedule mode. View Schedule mode is not
                            available until you have clicked the "Generate" button. After you have
                            generated some schedules, you can switch between your planned schedules
                            and generated schedules by clicking the button below the searching bar.
                            You should not modify a generated schedule. Although doing so will not
                            break anything, it will trigger a warning because it is a common mistake
                            🤔. What you should do instead is to switch back to the planned schedule
                            and modify it.
                        </p>
                    </div>
                </div>

                <h4 id="item-1-3">Website Info</h4>
                <h5>Website Address</h5>
                <p>
                    The primary address of our website is
                    <a href="https://plannable.org">https://plannable.org</a>. It is hosted on
                    GitHub. Since we load content from many sources, it may take a while for
                    first-time loading. For users in China, we provide a <strong>mirror</strong> (<a
                        href="https://cn.plannable.org"
                        >https://cn.plannable.org</a
                    >) whose content is synchronized with the primary website once per hour. Note
                    that it automatically redirects to
                    <a href="https://plannable.gitee.io">https://plannable.gitee.io</a>, because to
                    host websites in China, one needs to register at ICP (ICP备案), which is somehow
                    complicated. To avoid such a burden, we hosted our website on gitee.io, a top
                    level domain operated by a Chinese company. However, your data is not
                    synchronized (and it is techniqually impossible to do so). If you want to
                    transfer your data between them, you need to use the
                    <a href="#item-7-2">Export to JSON</a> function provided.
                </p>

                <h5>Privacy</h5>
                <p>
                    Our website contains no server-side code, which means when the web page and the
                    course data is fully loaded, it operates on your browser, locally, and it will
                    still be functional even if you are offline. By this means, we can host our
                    website on free platforms that provide no server-side functionality like GitHub
                    pages, eliminating most of the costs.
                </p>
                <p>
                    Moreover, your privacy gets protected. All your data, including courses,
                    filters, events and settings, are stored in your computer, becaue we do not have
                    a server that can store such data. We will never retrieve these data without
                    prior notification.
                </p>
                <p>
                    Like most of the websites out there, we use Google analytics to analyze the
                    number and the distribution of users across the globe. The data collected do not
                    contain identifying information.
                </p>
                <button type="button" class="btn btn-primary btn-lg my-5 float-right" @click="showGuide(2)">
                    Next Page: A Quick Start
                </button>
            </div>

            <div v-if="selected === 2 || !selected">
                <h3 id="item-2"><i class="far fa-calendar-alt"></i> A Quick Start</h3>
                <hr />

                <h5 id="item-2-0" class="mt-4">
                    <i class="fa fa-university" aria-hidden="true"></i
                    ><strong> Course Searching</strong>
                </h5>
                <p>
                    We provide an all-in-one search box that generates realtime feedback. It is
                    case-insensitve and can do partial matching (e.g. "linear alg" for "linear
                    algebra"). However, advance fuzzy search, such as "info tech" for "information
                    technology" is not supported, because it is too slow to provide realtime
                    results. The searching engine is able to search the following fields of each
                    course and section.
                </p>

                <div class="border border-danger rounded p-2 mb-2 bg-light text-dark mx-5">
                    <ol>
                        <li>Course number: econ 2020, 2102, with or without spaces</li>
                        <li>Course title: microecon, discrete, etc.</li>
                        <li>Topic of a section*: yoga, computation, design, etc</li>
                        <li>Professor name*: bloomfield, elzinga, etc</li>
                        <li>Description: video, fourier transform, etc.</li>
                    </ol>
                </div>
                <p>
                    Starred fields are fields of sections, not courses. While other fields filter
                    out courses, these filter out sections. Our algorithm matches the fields in the
                    order given by the list above, which means a course that has a title "linear
                    algebra" will come before a section that has topic "linear algebra" in the
                    results.
                </p>
                <p>
                    Keywords that match these fields will be highlighted. If none of the
                    courses/sections are highlighted at the first glance, it is likely that your
                    input is a description match, which can be shown by clicking the
                    <i class="fas fa-info-circle"></i> icon.
                </p>
                <v-card class="mt-3 mb-5 mx-auto gif-center">
                    <v-img :src="imgPath('match-desc.png')"></v-img>
                </v-card>

                <h5 id="item-2-1" class="mt-4">
                    <i class="fa fa-university" aria-hidden="true"></i
                    ><strong> Schedule Manipulation</strong>
                </h5>

                <div class="row mt-3 mb-5">
                    <div class="col-sm">
                        <v-card>
                            <v-img :src="imgPath('search_class.png')" aspect-ratio="1.6"></v-img>

                            <v-card-title primary-title>
                                <div>
                                    <h5 class="headline mb-3">Add Courses</h5>
                                    <div>
                                        You can add courses by
                                        <font class="amber lighten-3">searching</font> department,
                                        professor, class number, or keywords. Pick a section or
                                        multiple sections that you want to take, or choose "<font
                                            class="amber lighten-3"
                                            >any section</font
                                        >" if you don't have a particular preference. To clear your
                                        search query, press
                                        <font class="amber lighten-3">ESC</font> or click on the
                                        <i class="fas fa-times click-icon"> </i> button at the right
                                        end of the search box.
                                    </div>
                                </div>
                            </v-card-title>
                        </v-card>
                    </div>
                    <div class="col-sm">
                        <v-card>
                            <v-img
                                :src="imgPath('generate_schedule.png')"
                                aspect-ratio="1.6"
                            ></v-img>

                            <v-card-title primary-title>
                                <div>
                                    <h5 class="headline mb-3">Generate Schedules</h5>
                                    <div>
                                        After you have finished selecting your courses, you can hit
                                        the
                                        <font class="lime lighten-3">generate</font> button to
                                        generate all possibles schedules out of the sections you
                                        selected. You can switch between the generated schedule and
                                        your current selection by clicking the "<font
                                            class="lime lighten-3"
                                            >edit class</font
                                        >/<font class="lime lighten-3">view schedule</font>" button
                                        below the search bar.
                                    </div>
                                </div>
                            </v-card-title>
                        </v-card>
                    </div>
                    <div class="col-sm">
                        <v-card>
                            <v-img
                                :src="imgPath('multiple_schedule.png')"
                                aspect-ratio="1.6"
                            ></v-img>

                            <v-card-title primary-title>
                                <div>
                                    <h5 class="headline mb-3">Multiple Schedules</h5>
                                    <div>
                                        You can plan multiple schedules at the same time. Click the
                                        <i
                                            class="far fa-calendar-plus click-icon teal lighten-4"
                                        ></i>
                                        icon, you will have a new empty schedule independent with
                                        your existing schedules. Click
                                        <i class="fas fa-long-arrow-alt-left teal lighten-4"></i> or
                                        <i class="fas fa-long-arrow-alt-right teal lighten-4"></i>
                                        to navigate through your schedules. Use
                                        <i class="far fa-copy click-icon teal lighten-4"></i> to
                                        make a copy of the current scheudle, and use
                                        <i class="far fa-calendar-times teal lighten-4"></i> delete
                                        the current schedule.
                                    </div>
                                </div>
                            </v-card-title>
                        </v-card>
                    </div>
                </div>

                <p class="lead px-4 py-2 border-left border-info" style="background-color: #eeeeee">
                    Tip: It is recommeded that you prepare "backup" schedules using the "Multiple
                    Schedule" function provided, especially if you are trying to enroll in some
                    popular courses or popular professors' sections.
                </p>

                <v-stepper non-linear class="mb-5">
                    <v-stepper-header>
                        <v-stepper-step color="blue-grey" editable step="1">
                            Add Classes
                        </v-stepper-step>

                        <v-divider></v-divider>

                        <v-stepper-step color="blue-grey" editable step="2">
                            Generate Schedules
                        </v-stepper-step>

                        <v-divider></v-divider>

                        <v-stepper-step color="blue-grey" editable step="3">
                            Multiple Schedules
                        </v-stepper-step>
                    </v-stepper-header>

                    <v-stepper-items>
                        <v-stepper-content step="1">
                            <v-card class="mb-5">
                                <v-img :src="imgPath('select_class.gif')">
                                    <template v-slot:placeholder>
                                        <v-layout fill-height align-center justify-center ma-0>
                                            <v-progress-circular
                                                indeterminate
                                                color="purple"
                                            ></v-progress-circular>
                                        </v-layout>
                                    </template>
                                </v-img>
                            </v-card>
                        </v-stepper-content>

                        <v-stepper-content step="2">
                            <v-card class="mb-5">
                                <v-img :src="imgPath('generate_class.gif')">
                                    <template v-slot:placeholder>
                                        <v-layout fill-height align-center justify-center ma-0>
                                            <v-progress-circular
                                                indeterminate
                                                color="purple"
                                            ></v-progress-circular>
                                        </v-layout>
                                    </template>
                                </v-img>
                            </v-card>
                        </v-stepper-content>

                        <v-stepper-content step="3">
                            <v-card class="mb-5">
                                <v-img :src="imgPath('multiple_schedule.gif')">
                                    <template v-slot:placeholder>
                                        <v-layout fill-height align-center justify-center ma-0>
                                            <v-progress-circular
                                                indeterminate
                                                color="purple"
                                            ></v-progress-circular>
                                        </v-layout>
                                    </template>
                                </v-img>
                            </v-card>
                        </v-stepper-content>
                    </v-stepper-items>
                </v-stepper>

                <h5 id="item-2-2" class="mt-4">
                    <i class="fa fa-university" aria-hidden="true"></i
                    ><strong> Schedule Rendering</strong>
                </h5>
                <p class="mb-1">
                    It is better for you to know under what conditions are courses rendered on the
                    schedule. In Edit Class mode, only the following type of courses are rendered on
                    the grid.
                </p>
                <ul>
                    <li>
                        Courses that only have one available section and have "Any Section" selected
                    </li>
                    <li>
                        Courses that have one section selected
                    </li>
                    <li>
                        Courses that have multiple sections selected if "show multiple sections"
                        checkbox is checked.
                    </li>
                </ul>
                <p>
                    For example, in Fall 2019, CS 1110 has four available sections. If you select
                    "Any Section", then none of the sections will be shown. If you select section 1
                    and section 2, they will be both shown on the schedule if "show multiple
                    sections" checkbox is checked. However, PSYC 1010 only has one section
                    available, so selecting "Any Section" for it will result in the "only one" being
                    rendered.
                </p>

                <h5 id="item-2-3" class="mt-4">
                    <i class="fa fa-university" aria-hidden="true"></i
                    ><strong> Enroll in SIS</strong>
                </h5>
                <p>
                    For convenience, we provide a list of course IDs for your currently active
                    schedule at the bottom left corner under "Schedule Overview". These IDs can be
                    direcly entered into SIS, through the input box left to your shopping cart.
                </p>
                <v-card class="my-3 mx-auto gif-center">
                    <v-img :src="imgPath('enroll-sis.png')"></v-img>
                </v-card>
                <p>
                    If some of the IDs are missing, it is likely that you are in "Edit class" mode
                    and you selected "Any section" for that course. If there is a "+1" (or a higher
                    number) after an ID, it means that course has more than one sections available
                    at the given time shown in your schedule. To view the list of sections, click
                    the corresponding course block rendered in the grid. For example, in the
                    schedule shown below, there are five available ENWR 1510 on Monday and Wednesday
                    from 5:00 to 6:15PM.
                </p>
                <v-card class="mt-3 mb-5 mx-auto gif-center">
                    <v-img :src="imgPath('multi-section.png')"></v-img>
                </v-card>
                <button type="button" class="btn btn-primary btn-lg my-5 float-right" @click="showGuide(3)">
                    Next Page: Add Event
                </button>
            </div>

            <div v-if="selected === 3 || !selected">
                <h3 id="item-3"><i class="fab fa-elementor"></i> Add Event</h3>
                <hr />
                <p>
                    You can add your weekly commitments on the schedule, such as club meetings,
                    office hours, etc. You can edit an existing event by clicking it on the
                    schedule. The schedule generator will generate schedules that do not conflict
                    with your events. However, if it is not possible to find such a schedule, an
                    error will be thrown.
                </p>
                <p>
                    Note that events in different planned schedules are independent from each other.
                    That is, when you edit the event in your planned schedule 1, it does not affect
                    your planned schedule 2.
                </p>
                <v-card class="my-5 mx-auto gif-center">
                    <v-img :src="imgPath('add_event.gif')">
                        <template v-slot:placeholder>
                            <v-layout fill-height align-center justify-center ma-0>
                                <v-progress-circular
                                    indeterminate
                                    color="purple"
                                ></v-progress-circular>
                            </v-layout>
                        </template>
                    </v-img>
                </v-card>
                <button type="button" class="btn btn-primary btn-lg my-5 float-right" @click="showGuide(4)">
                    Next Page: Filters
                </button>
            </div>
            <div v-if="selected === 4 || !selected">
                <h3 id="item-4"><i class="fas fa-filter"></i> Filters</h3>
                <hr />
                <p>
                    Filters allow you to set parameters to eliminate unwanted or redundant generated
                    schedules. They also help to find the optimal schedule in your definition.
                </p>
                <h5 id="item-4-1" class="mt-4">
                    <i class="fa fa-university" aria-hidden="true"></i
                    ><strong> No Class Time</strong>
                </h5>
                <p>
                    You can select time and day at which you do not wish to have class.
                </p>
                <v-card class="my-4 mx-auto gif-center">
                    <v-img :src="imgPath('no-class-time.gif')">
                        <template v-slot:placeholder>
                            <v-layout fill-height align-center justify-center ma-0>
                                <v-progress-circular
                                    indeterminate
                                    color="purple"
                                ></v-progress-circular>
                            </v-layout>
                        </template>
                    </v-img>
                </v-card>
                <h5 id="item-4-2" class="mt-4">
                    <i class="fa fa-university" aria-hidden="true"></i
                    ><strong> Allow Waitlist/Closed</strong>
                </h5>
                <p>
                    You can choose to include or exclude wait list or closed sections by ticking
                    these two checkboxes.
                </p>
                <h5 id="item-4-3" class="mt-4">
                    <i class="fa fa-university" aria-hidden="true"></i
                    ><strong> Sort Schedules</strong>
                </h5>
                <p>
                    One powerful feature comes with auto-scheduling is that the generated schedules
                    can be sorted based on one or a combination of options. You can select multiple
                    sort options to optimize your schedule, and drag sort options to change their
                    priority in fallback mode. Note that all of the sort options are responsive,
                    i.e. they will be applied instantly after your changes.
                </p>

                <h6>Sort Options</h6>
                Currently, we provide the following list of sort options. If you prefer a
                mathematical description on how they are computed, see
                <a href="#item-11-1">Appendix</a>.
                <div class="border border-danger rounded p-2 mb-2 bg-light text-dark mx-5">
                    <ol>
                        <li>Variance: Balance the class time each day</li>
                        <li>Vertical compactness: Make classes back-to-back</li>
                        <li>Lunch Time: Leave spaces for lunch</li>
                        <li>No Early: Start the day as late as possible</li>
                        <li>Walking Distance: Avoid long distance walking between classes</li>
                        <li>I'm Feeling Lucky: Sort Randomly</li>
                    </ol>
                </div>
                <p>
                    It is possible to reverse one or more of the sort options provided above: just
                    click the <i class="fas fa-arrow-up"></i> icon. For example, if you do NOT want
                    your schedule to be very compact (i.e. you want to have some time to rest
                    between classes), you can enable "Vertical compactness" and click the
                    <i class="fas fa-arrow-up"></i> icon so it becomes
                    <i class="fas fa-arrow-down"></i>.
                </p>

                <h6>Sort Modes</h6>
                And there are two avaiable sort modes.
                <div class="border border-danger rounded p-2 mb-2 bg-light text-dark mx-5">
                    <ol>
                        <li>
                            Combined: Combine all sorting options enabled and give them equal weight
                        </li>
                        <li>
                            Fallback: Sort using the options on top first. If two schedules are
                            compared equal using that option, sort using the next option.
                        </li>
                    </ol>
                </div>
                <h6>Tips on choosing sort modes</h6>
                If you want to balance between multiple sort options, try "combined". On the other
                hand, if you want to prioritize a single sort option (such as No Early), then try
                "fallback", as it will sort using options on top first.

                <v-card class="my-5 mx-auto gif-center">
                    <v-img :src="imgPath('sort.gif')">
                        <template v-slot:placeholder>
                            <v-layout fill-height align-center justify-center ma-0>
                                <v-progress-circular
                                    indeterminate
                                    color="purple"
                                ></v-progress-circular>
                            </v-layout>
                        </template>
                    </v-img>
                </v-card>

                <!-- <h3 id="item-5">Display Settings</h3>
                <hr /> -->
                <button type="button" class="btn btn-primary btn-lg my-5 float-right" @click="showGuide(6)">
                    Next Page: Customize Colors
                </button>
            </div>
            <div v-if="selected === 6 || !selected">
                <h3 id="item-6"><i class="fas fa-palette"></i> Customize Colors</h3>
                <hr />
                <p>
                    We have a number of colors built in that are used to automatically color your
                    courses and events (based on hashes, if you are curious). Because we are aware
                    that they are not aesthetically appealing, we provide the Palette for you to
                    customize colors.
                </p>
                <p>
                    You can either click the
                    <i class="fas fa-sync-alt mr-1"></i> icon to use a random color or click
                    <input type="color" style="width: 30px" value="#deadbb" /> to select your
                    favorite color. The default color can be recovered by clicking the
                    <i class="fas fa-times"></i> icon. If you find that there are courses missing
                    from the palette, it may because you selected "Any Section" for that course and
                    did not switch to "View Schedule" mode.
                </p>
                <button type="button" class="btn btn-primary btn-lg my-5 float-right" @click="showGuide(7)">
                    Next Page: Import and Export
                </button>
            </div>
            <div v-if="selected === 7 || !selected">
                <h3 id="item-7"><i class="fas fa-download"></i> Import and Export</h3>
                <hr />
                <h5 id="item-7-1" class="mt-4">
                    <i class="fa fa-university" aria-hidden="true"></i
                    ><strong> Export to iCalendar</strong>
                </h5>
                <p>
                    ICalendar is a standard file format used to represent information in a calendar.
                    Apple and Google calendar both support importing from iCalendar files. However,
                    we currently do NOT support importing from iCalendar files. If you want to
                    re-import your schedule sometime later, you must use
                    <a href="#item-7-2">export to JSON</a>.
                </p>
                <p>
                    The instruction on how to export your schedule to a iCalendar file and import it
                    to your Google calendar is shown below.
                </p>
                <v-stepper v-model="e2" class="my-5 mx-auto" style="width:60vw;">
                    <v-stepper-header>
                        <v-stepper-step
                            v-for="idx in icalSteps.length"
                            :key="idx"
                            :complete="e2 > idx"
                            :step="idx"
                            style="margin:auto auto;cursor:pointer"
                            color="blue-grey"
                            :complete-icon="`fas fa-check`"
                            @click="e2 = idx"
                        ></v-stepper-step>
                    </v-stepper-header>

                    <v-stepper-items>
                        <v-stepper-content v-for="(step, _) in icalSteps" :key="_" :step="_ + 1">
                            <v-card class="mb-2 mx-auto" width="54vw">
                                <v-img :src="step.src" aspect-ratio="2.37"></v-img>
                            </v-card>
                            <v-card-title class="mb-2" primary-title>
                                <div>
                                    <div>{{ step.title }}</div>
                                </div>
                            </v-card-title>
                            <v-btn
                                color="blue-grey"
                                style="color:white"
                                @click="e2 === icalSteps.length ? (e2 = 1) : e2++"
                                >{{ e2 === icalSteps.length ? 'Play Again' : 'Continue' }}
                            </v-btn>
                            <v-btn
                                v-if="e2 !== 1"
                                color="blue-grey"
                                style="color:white"
                                @click="e2--"
                            >
                                Back
                            </v-btn>
                        </v-stepper-content>
                    </v-stepper-items>
                </v-stepper>

                <h5 id="item-7-2" class="mt-4">
                    <i class="fa fa-university" aria-hidden="true"></i
                    ><strong> Export to/Import From JSON</strong>
                </h5>
                <div class="row">
                    <div class="col col-7">
                        <p>
                            You can export your schedule to a JSON file (a file that ends with
                            .json) so that it can be re-imported later. It is a dedicated file
                            format that we use to store information in your schedule, so it could
                            only be used on our website.
                        </p>
                        <p>
                            To re-import a JSON file, simply click the file chooser, find the file
                            and confirm.
                        </p>
                    </div>
                    <div class="col col-md-auto">
                        <img :src="imgPath('export-json.png')" width="240px" alt="export to json" />
                    </div>
                </div>
                <button type="button" class="btn btn-primary btn-lg my-5 float-right" @click="showGuide(9)">
                    Next Page: Contributing, Disclaimer, and Appendix
                </button>
            </div>
            <div v-if="selected === 9 || !selected">
                <h3 id="item-9">Contributing</h3>
                <hr />
                <p>
                    Our website is completely free and open sourse under the GPL-v3 license. Our
                    source code is
                    <a href="https://github.com/awesome-schedule/Awesome-SchedulAR" target="_blank">
                        available at GitHub </a
                    >, and we welcome contribution of any kind. You can submit bug reports or
                    feature requests through issue, and you can directly contribute to our codebase
                    via pull requests!
                </p>
                <h5 id="item-9-1" class="mt-4">
                    <i class="fa fa-university" aria-hidden="true"></i
                    ><strong> Contact Authors</strong>
                </h5>

                <p>The primiary contributors of this website are</p>
                <ol>
                    <li>
                        Hanzhi Zhou &nbsp;&nbsp;<i class="fab fa-github"></i>
                        <a href="https://github.com/hanzhi713"> https://github.com/hanzhi713 </a>
                        &nbsp;<i class="fas fa-envelope"></i>
                        <a href="mailto:hz2zz@virginia.edu"> hz2zz@virginia.edu</a>
                    </li>
                    <li>
                        Kaiying "Cat" Shan &nbsp;&nbsp;
                        <i class="fab fa-github"></i>
                        <a href="https://github.com/kaiyingshan">
                            https://github.com/kaiyingshan
                        </a>
                        &nbsp;<i class="fas fa-envelope"></i>
                        <a href="mailto:ks5qug@virginia.edu"> ks5qug@virginia.edu</a>
                    </li>
                    <li>
                        Zichao Hu &nbsp;&nbsp;<i class="fab fa-github"></i>
                        <a href="https://github.com/OAHC2022"> https://github.com/OAHC2022 </a>
                        &nbsp;<i class="fas fa-envelope"></i>
                        <a href="mailto:zh2wc@virginia.edu"> zh2wc@virginia.edu</a>
                    </li>
                </ol>
                <p>
                    Our contribution log is available
                    <a
                        href="https://github.com/awesome-schedule/Awesome-SchedulAR/blob/master/docs/Contribution.md"
                        target="_blank"
                    >
                        here</a
                    >.
                </p>

                <h5 id="item-9-2" class="mt-4">
                    <i class="fa fa-university" aria-hidden="true"></i><strong> Bug Reports</strong>
                </h5>
                <p>
                    We track issues and bug reports on GitHub. If you find any problem that appears
                    to be a bug of our website, please submit a bug report by
                    <a href="https://github.com/awesome-schedule/Awesome-SchedulAR/issues"
                        >opening an issue</a
                    >. Note that you will need a GitHub account.
                </p>

                <h3 id="item-10">Disclaimer</h3>
                <hr />
                <p>
                    Although we have made as much effort as we can to ensure that our website is
                    functional and provides the correct information, please remember that our
                    website comes with no warranty and we do not hold any liability for any damages.
                    This is explicitly covered under the
                    <a
                        href="https://github.com/awesome-schedule/Awesome-SchedulAR/blob/f56d510b09dbd8abd72314f4d4856f69658f5487/LICENSE#L589"
                        target="_blank"
                        >GPL license </a
                    >.
                </p>
                <p>
                    The only authentic source of course data is the Student Information System
                    (SIS). For your benefit, it is recommended that you put your courses in the
                    shopping cart in SIS and check whether the meeting times are consistent with
                    that shown on our website as soon as you have finished customizing your
                    schedules. If you find any inconsistency, please email to our authors and open
                    an issue on our GitHub immediately.
                </p>

                <h3 id="item-11">Appendix</h3>
                <hr />
                <h5 id="item-11-1" class="mt-4">
                    <i class="fa fa-university" aria-hidden="true"></i
                    ><strong> Calculation of Sort Options</strong>
                </h5>
                <div class="mt-2 mb-4">
                    For each schedule, a single/array of coefficients are calculated, depending on
                    the sort options enabled. The generated schedules then are sorted in ascending
                    order. The following formulae provide an overview on how these coefficients are
                    calculated. To know exactly how they are implemented, please refer to
                    <a
                        href="https://github.com/awesome-schedule/Awesome-SchedulAR/blob/master/src/algorithm/ScheduleEvaluator.ts"
                        target="_blank"
                    >
                        our code</a
                    >.
                </div>
                <vue-mathjax :formula="formula"></vue-mathjax>

                <h5 id="item-11-2" class="mt-4">
                    <i class="fa fa-university" aria-hidden="true"></i
                    ><strong> Browser Compactibility</strong>
                </h5>
                <p>
                    Our website should run without problem on mainstream browsers of the latest
                    version (except IE). Due to the fact that our website leverages new CSS3
                    features (e.g. grid layout), we require Chrome &ge; 57, Edge &ge; 16, Firefox
                    &ge; 52, Opera &ge; 44 or Safari &ge; 10.3.
                </p>

                <h5 id="item-11-3" class="mt-4">
                    <i class="fa fa-university" aria-hidden="true"></i
                    ><strong> Source of Data</strong>
                </h5>
                <p>
                    Our website fetches course data from
                    <a target="_blank" href="https://rabi.phys.virginia.edu/mySIS/CS2/"
                        >Lou's list</a
                    >
                    on page load and stores it in your browser cache. The default cache expiration
                    time is 2 hours, which means if you refresh the page 2 hours after the data is
                    loaded, it will be re-fetched. You can manually update course data by cliking
                    the "Update semester data" button under the setting tab
                    <i class="fas fa-cog"></i>. However, there is no need to update it very
                    frequently, because Lou's list itself only updates on an hourly basis.
                </p>

                <div class="py-5 my-5" style="height: 600px;"></div>
            </div>
        </div>
    </div>
</template>

<script lang="ts" src="./Information.ts"></script>

<style scoped>
#navbar-scrollspy {
    position: fixed;
}

#info-content {
    margin-right: 5vw;
    margin-top: 5vh;
    font-size: 15px;
}

.gif-center {
    width: 85%;
}

.check-size {
    font-size: 0.8rem !important;
}

@media (max-width: 600px) {
    #navbar-scrollspy {
        display: none !important;
    }

    #info-content {
        margin-left: 15vw !important;
    }

    .gif-center {
        width: 100%;
    }
}
</style>
