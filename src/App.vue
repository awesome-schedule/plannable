<template>
    <div id="app" class="w-100" @change="onDocChange">
        <course-modal></course-modal>
        <section-modal :semester="currentSemester"></section-modal>

        <!-- Tab Icons Start (Leftmost bar) -->
        <nav
            class="d-block bg-light tab-bar"
            :style="{
                width: sideBarWidth + 'vw'
            }"
        >
            <div
                class="tab-icon mt-0 mb-4"
                :class="{ 'tab-icon-active': sideBar.showSelectClass }"
                title="Select Classes"
                @click="switchSideBar('showSelectClass')"
            >
                <i class="far fa-calendar-alt"></i>
            </div>
            <div
                class="tab-icon mt-0 mb-4"
                :class="{ 'tab-icon-active': sideBar.showEvent }"
                title="Edit Events"
                @click="switchSideBar('showEvent')"
            >
                <i class="fab fa-elementor"></i>
            </div>
            <div
                class="tab-icon mt-0 mb-4"
                :class="{ 'tab-icon-active': sideBar.showFilter }"
                title="Filters"
                @click="switchSideBar('showFilter')"
            >
                <i class="fas fa-filter"></i>
            </div>
            <div
                class="tab-icon mt-0 mb-4"
                :class="{ 'tab-icon-active': sideBar.showSetting }"
                title="Display Settings"
                @click="switchSideBar('showSetting')"
            >
                <i class="fas fa-cog"></i>
            </div>
            <div
                class="tab-icon mt-0 mb-4"
                :class="{ 'tab-icon-active': sideBar.showSelectColor }"
                title="Customize Colors"
                @click="switchSideBar('showSelectColor')"
            >
                <i class="fas fa-palette"></i>
            </div>
            <div
                class="tab-icon mt-0 mb-4"
                :class="{ 'tab-icon-active': sideBar.showExport }"
                title="Import/Export Schedule"
                @click="switchSideBar('showExport')"
            >
                <i class="fas fa-download"></i>
            </div>
            <div
                title="Tutorials, miscellaneous information and acknowledgments"
                :class="{ 'tab-icon-active': sideBar.showInfo }"
                class="tab-icon mb-4"
                @click="switchSideBar('showInfo')"
            >
                <i class="fas fa-info-circle"></i>
            </div>
            <!-- <div
                title="What's happening"
                :class="{ 'tab-icon-active': sideBar.showExternal }"
                class="tab-icon mb-4"
                @click="switchSideBar('showExternal')"
            >
                <i class="fas fa-bullhorn"></i>
            </div> -->
        </nav>
        <!-- Tab Icons End (Leftmost bar) -->

        <nav v-if="sideBar.showSelectClass" class="d-block bg-light sidebar">
            <div class="dropdown">
                <button id="semester" class="btn btn-info nav-btn mt-0" data-toggle="dropdown">
                    <span v-if="loading" class="spinner-border spinner-border-sm"></span>
                    {{ currentSemester ? currentSemester.name : 'Select Semester' }}
                    <i class="fas fa-caret-down ml-4" style="font-size: 20px;"></i>
                </button>
                <div v-if="semesters.length" class="dropdown-menu w-100">
                    <a
                        v-for="(semester, idx) in semesters"
                        :key="semester.id"
                        class="dropdown-item w-100"
                        href="#"
                        @click="selectSemester(idx)"
                        >{{ semester.name }}
                    </a>
                </div>
            </div>
            <div class="input-group mt-2">
                <input
                    ref="classSearch"
                    type="text"
                    class="form-control form-control-sm"
                    placeholder="Title/Number/Topic/Prof./Desc."
                    @input="getClass($event.target.value)"
                    @keyup.esc="closeClassList"
                />
                <div class="input-group-append">
                    <span
                        class="input-group-text px-2"
                        :class="{ 'click-icon': isEntering }"
                        @click="closeClassList"
                        ><i v-if="isEntering && sideBar.showSelectClass" class="fas fa-times"> </i>
                        <i v-else class="fas fa-search"></i>
                    </span>
                </div>
            </div>

            <div v-if="isEntering" ref="classList" class="card card-body p-1">
                <ClassList
                    ref="enteringClassList"
                    :courses="inputCourses"
                    :schedule="currentSchedule"
                    :is-entering="isEntering"
                    :generated="generated"
                    @update_course="updateCourse"
                    @close="closeClassList"
                ></ClassList>
            </div>
            <div>
                <div class="mt-3">
                    <button
                        class="btn btn-info nav-btn"
                        :title="
                            generated
                                ? 'Click to edit your schedule'
                                : 'Click to view generated schedules'
                        "
                        @click="switchSchedule(!generated)"
                    >
                        {{
                            generated
                                ? `View Schedule: ${currentScheduleIndex + 1}`
                                : 'Edit Classes'
                        }}
                        <i class="fas fa-exchange-alt ml-4" style="font-size: 18px;"></i>
                    </button>
                </div>
                <div class="mx-1">
                    <div class="mx-3">
                        <div
                            class="row no-gutters align-items-center justify-content-between"
                            style="font-size: 24px"
                        >
                            <div class="col-auto">
                                <i
                                    class="fas fa-long-arrow-alt-left"
                                    title="previous schedule"
                                    :class="
                                        proposedScheduleIndex > 0 ? 'click-icon' : 'icon-disabled'
                                    "
                                    @click="switchProposed(proposedScheduleIndex - 1)"
                                ></i>
                            </div>
                            <div class="col-auto" style="font-size: 20px;">
                                {{ proposedScheduleIndex + 1 }}
                            </div>
                            <div class="col-auto">
                                <i
                                    class="fas fa-long-arrow-alt-right"
                                    title="next schedule"
                                    :class="
                                        proposedScheduleIndex < proposedSchedules.length - 1
                                            ? 'click-icon'
                                            : 'icon-disabled'
                                    "
                                    @click="switchProposed(proposedScheduleIndex + 1)"
                                ></i>
                            </div>
                            <div class="col-auto">
                                <i
                                    class="far fa-calendar-plus click-icon"
                                    title="new schedule"
                                    @click="newProposed"
                                ></i>
                            </div>
                            <div class="col-auto">
                                <i
                                    class="far fa-copy click-icon"
                                    title="copy the current schedule to a new schedule"
                                    @click="copyCurrent"
                                >
                                </i>
                            </div>
                            <div class="col-auto">
                                <i
                                    class="far fa-calendar-times"
                                    :class="
                                        proposedSchedules.length > 1
                                            ? 'click-icon'
                                            : 'icon-disabled'
                                    "
                                    title="delete current schedule"
                                    @click="deleteProposed()"
                                ></i>
                            </div>
                        </div>
                    </div>
                    <ClassList
                        ref="selectedClassList"
                        :courses="currentSchedule.currentCourses"
                        :schedule="currentSchedule"
                        :generated="generated"
                        @update_course="updateCourse"
                        @remove_course="removeCourse"
                    ></ClassList>
                    <div class="btn-group mt-3 w-100">
                        <button
                            type="button"
                            class="btn btn-outline-info"
                            @click="generateSchedules"
                        >
                            Generate
                        </button>
                        <button
                            class="btn btn-outline-info"
                            title="Remove all classes from the current schedule"
                            @click="clear"
                        >
                            Clean
                        </button>
                    </div>
                    <div
                        title="render all selected sections (except for 'any section')"
                        class="custom-control custom-checkbox mt-2 mx-2"
                    >
                        <input
                            id="multiSelect"
                            v-model="display.multiSelect"
                            type="checkbox"
                            class="custom-control-input"
                        />
                        <label class="custom-control-label" for="multiSelect">
                            Show Multiple Sections
                        </label>
                    </div>
                </div>
            </div>
            <div class="btn bg-info nav-btn mt-2">
                Schedule Overview
            </div>
            <ul class="list-group list-group-flush" style="width:99%">
                <li class="list-group-item">Total Credits: {{ currentSchedule.totalCredit }}</li>
                <li class="list-group-item pr-0">
                    <table style="width:100%;font-size:14px">
                        <tr v-for="item in currentIds" :key="item[0]">
                            <td>{{ item[0] }}</td>
                            <td>{{ item[1] }}</td>
                        </tr>
                    </table>
                </li>
            </ul>
        </nav>

        <event-view
            v-else-if="sideBar.showEvent"
            :schedule="generated ? proposedSchedule : currentSchedule"
            :event="eventToEdit"
        >
        </event-view>

        <nav v-else-if="sideBar.showFilter" class="d-block bg-light sidebar">
            <div class="btn bg-info nav-btn">
                Filters
            </div>
            <ul class="list-group list-group-flush mx-1">
                <li
                    class="list-group-item px-3"
                    title="Time periods when you don't want to have class"
                >
                    No Class Time
                    <div
                        style="float: right"
                        title="Click to add a time period when you don't want to have class"
                        class="filter-add px-4"
                        @click="addTimeSlot"
                    >
                        <i class="fas fa-plus"></i>
                    </div>
                </li>
                <li v-for="(value, i) in timeSlots" :key="i" class="list-group-item p-1">
                    <div class="btn-group btn-days my-2" role="group">
                        <button
                            v-for="(day, j) in days"
                            :key="j"
                            :class="'btn btn-outline-secondary' + (value[j] ? ' active' : '')"
                            type="button"
                            @click="updateFilterDay(i, j)"
                        >
                            {{ day }}
                        </button>
                    </div>
                    <div class="form-group row no-gutters align-items-center text-center mb-2">
                        <div class="col col-5 align-self-center">
                            <input
                                v-model="value[5]"
                                type="time"
                                min="8:00"
                                max="22:00"
                                class="form-control form-control-sm"
                            />
                        </div>
                        <div class="col col-1 align-self-center">-</div>
                        <div class="col col-5">
                            <input
                                v-model="value[6]"
                                type="time"
                                min="8:00"
                                max="22:00"
                                class="form-control form-control-sm"
                            />
                        </div>
                        <div class="col col-1 align-self-center">
                            <i
                                class="fas fa-times click-icon"
                                style="font-size: 1.25rem"
                                @click="removeTimeSlot(i)"
                            ></i>
                        </div>
                    </div>
                </li>
                <li class="list-group-item">
                    <div class="custom-control custom-checkbox my-1">
                        <input
                            id="awt"
                            v-model="allowWaitlist"
                            type="checkbox"
                            class="custom-control-input"
                        />
                        <label class="custom-control-label" for="awt">Allow Wait List</label>
                    </div>
                    <div class="custom-control custom-checkbox">
                        <input
                            id="ac"
                            v-model="allowClosed"
                            type="checkbox"
                            class="custom-control-input"
                        />
                        <label class="custom-control-label" for="ac">Allow Closed</label>
                    </div>
                </li>
                <li class="list-group-item">
                    <button
                        type="button"
                        class="btn btn-outline-info w-100"
                        @click="generateSchedules"
                    >
                        Apply
                    </button>
                </li>

                <div class="btn bg-info nav-btn">
                    Sort Priority
                </div>
                <li
                    class="list-group-item px-3"
                    title="Note that you can drag sort options to change their priority in fallback mode"
                >
                    Sort According to
                </li>
                <draggable
                    v-model="sortOptions.sortBy"
                    handle=".drag-handle"
                    @end="if (sortOptions.mode == 0) changeSorting(undefined);"
                >
                    <div
                        v-for="(option, optIdx) in sortOptions.sortBy"
                        :key="option.name"
                        class="list-group-item py-1 pl-3 pr-0"
                    >
                        <div class="row no-gutters w-100">
                            <div class="col col-sm-9 pr-1 drag-handle" :title="option.description">
                                <span class="sort-option"> {{ option.title }}</span>
                            </div>
                            <div class="col col-sm-3">
                                <i
                                    class="fas mr-2 click-icon"
                                    :class="option.reverse ? 'fa-arrow-down' : 'fa-arrow-up'"
                                    title="Click to reverse sorting"
                                    @click="
                                        option.reverse = !option.reverse;
                                        changeSorting(optIdx);
                                    "
                                ></i>
                                <div
                                    class="custom-control custom-checkbox sort-option"
                                    style="display: inline-block"
                                >
                                    <input
                                        :id="option.name"
                                        v-model="option.enabled"
                                        type="checkbox"
                                        class="custom-control-input"
                                        :value="option.name"
                                        @change="changeSorting(optIdx)"
                                    />
                                    <label
                                        class="custom-control-label"
                                        :for="option.name"
                                        title="Enable this sorting option"
                                    ></label>
                                </div>
                            </div>
                        </div>
                    </div>
                </draggable>
                <li class="list-group-item">
                    <template v-for="mode in sortModes">
                        <div :key="'sm' + mode.mode" class="custom-control custom-radio">
                            <input
                                :id="'sm' + mode.mode"
                                v-model.number="sortOptions.mode"
                                type="radio"
                                :value="mode.mode"
                                class="custom-control-input"
                                @change="changeSorting()"
                            />
                            <label
                                class="custom-control-label"
                                :for="'sm' + mode.mode"
                                :title="mode.description"
                                >{{ mode.title }}
                            </label>
                        </div>
                    </template>
                </li>

                <div class="btn bg-info nav-btn">
                    Advanced
                </div>
                <li class="list-group-item pb-0">
                    <div class="form-group">
                        <label for="num-schedule">Max number of schedules</label>
                        <input
                            id="num-schedule"
                            v-model.number="display.maxNumSchedules"
                            type="number"
                            class="form-control"
                        />
                        <small class="form-text text-muted">
                            May crash your browser if too big
                        </small>
                    </div>
                </li>
                <li class="list-group-item">
                    <div
                        class="custom-control custom-checkbox"
                        title="Combine sections ocurring at the same time"
                    >
                        <input
                            id="comb-sec"
                            v-model="display.combineSections"
                            type="checkbox"
                            class="custom-control-input"
                        />
                        <label class="custom-control-label" for="comb-sec">Combine Sections</label>
                    </div>
                </li>
            </ul>
        </nav>

        <nav v-else-if="sideBar.showSetting" class="d-block bg-light sidebar">
            <div class="btn bg-info nav-btn">
                Schedule Display Settings
            </div>
            <form class="mx-2">
                <div
                    class="form-group row no-gutters mt-2 mb-1"
                    title="Schedule grid earlier than this time won't be displayed if you don't have any class"
                >
                    <label for="schedule-start" class="col-lg-6 col-form-label">
                        Schedule Start
                    </label>
                    <div class="col-lg-6">
                        <input
                            id="schedule-start"
                            v-model="display.earliest"
                            type="time"
                            class="form-control form-control-sm"
                        />
                    </div>
                </div>
                <div
                    class="form-group row no-gutters mb-1"
                    title="Schedule grid later than this time won't be displayed if you don't have any class"
                >
                    <label for="schedule-end" class="col-lg-6 col-form-label">Schedule End</label>
                    <div class="col-lg-6">
                        <input
                            id="schedule-end"
                            v-model="display.latest"
                            type="time"
                            class="form-control form-control-sm"
                        />
                    </div>
                </div>
                <div class="form-group row no-gutters mb-1" title="height of a class on schedule">
                    <label for="class-height" class="col-lg-6 col-form-label">Class Height</label>
                    <div class="col-lg-6">
                        <input
                            id="class-height"
                            v-model.number="display.fullHeight"
                            type="number"
                            class="form-control form-control-sm"
                        />
                    </div>
                </div>
                <div
                    class="form-group row no-gutters mb-3"
                    title="height of an empty cell. You can specify a smaller value to compress empty space"
                >
                    <label for="grid-height" class="col-lg-6 col-form-label">Grid Height</label>
                    <div class="col-lg-6">
                        <input
                            id="grid-height"
                            v-model.number="display.partialHeight"
                            type="number"
                            class="form-control form-control-sm"
                        />
                    </div>
                </div>
            </form>
            <div v-if="mobile" class="custom-control custom-checkbox mb-3 ml-3">
                <input
                    id="scroll"
                    v-model="scrollable"
                    type="checkbox"
                    class="custom-control-input"
                />
                <label for="scroll" class="custom-control-label">
                    scrollable
                </label>
            </div>
            <div class="btn bg-info nav-btn">
                Display Options
            </div>
            <ul class="list-group list-group-flush mx-1">
                <li class="list-group-item">Course Display</li>
                <li class="list-group-item">
                    <div class="custom-control custom-checkbox">
                        <input
                            id="displayTime"
                            v-model="display.showTime"
                            type="checkbox"
                            class="custom-control-input"
                        />
                        <label for="displayTime" class="custom-control-label">
                            Show Time
                        </label>
                    </div>
                    <div class="custom-control custom-checkbox">
                        <input
                            id="displayRoom"
                            v-model="display.showRoom"
                            type="checkbox"
                            class="custom-control-input"
                        />
                        <label for="displayRoom" class="custom-control-label">
                            Show Room
                        </label>
                    </div>
                    <div class="custom-control custom-checkbox">
                        <input
                            id="displayInstructor"
                            v-model="display.showInstructor"
                            type="checkbox"
                            class="custom-control-input"
                        />
                        <label for="displayInstructor" class="custom-control-label">
                            Show instructor
                        </label>
                    </div>
                </li>
                <li class="list-group-item mb-0" style="border-bottom: 0">
                    <div class="custom-control custom-checkbox">
                        <input
                            id="displayClasslistTitle"
                            v-model="display.showClasslistTitle"
                            type="checkbox"
                            class="custom-control-input"
                        />
                        <label for="displayClasslistTitle" class="custom-control-label">
                            Show title on class list
                        </label>
                    </div>
                </li>
            </ul>
            <div class="btn bg-info nav-btn">
                Time Options
            </div>
            <ul class="list-group list-group-flush mx-1">
                <li>
                    <div class="btn-group my-3 w-100" role="group">
                        <button
                            class="btn btn-secondary"
                            :class="{ active: display.standard }"
                            type="button"
                            @click="display.standard = true"
                        >
                            12 Hour
                        </button>
                        <button
                            class="btn btn-secondary"
                            :class="{ active: !display.standard }"
                            type="button"
                            @click="display.standard = false"
                        >
                            24 Hour
                        </button>
                    </div>
                </li>
                <li class="list-group-item">
                    <button
                        class="btn btn-outline-info mb-1 w-100"
                        @click="selectSemester(currentSemester.id, undefined, true)"
                    >
                        Update Semester Data
                    </button>
                    <small class="text-center form-text text-muted">
                        Last update: {{ lastUpdate }}
                    </small>
                </li>
                <li class="list-group-item">
                    <button class="btn btn-outline-danger w-100" @click="clearCache">
                        Reset All and Clean
                    </button>
                </li>
            </ul>
        </nav>

        <nav v-else-if="sideBar.showExport" class="d-block bg-light sidebar">
            <div class="btn bg-info nav-btn">
                Import/Export Schedule
            </div>
            <ul class="list-group list-group-flush mx-1">
                <li class="list-group-item px-1">
                    <div class="custom-file">
                        <input
                            id="customFile"
                            type="file"
                            class="custom-file-input"
                            accept="text/json"
                            style="width:100%"
                            @change="onUploadJson($event)"
                        />
                        <label class="custom-file-label" for="customFile">Import From..</label>
                    </div>
                    <small class="text-center form-text text-muted">
                        Import a .json file exported by our website
                    </small>
                </li>
                <li class="list-group-item">
                    <div class="form-group row mb-0">
                        <input
                            v-model="exportJson"
                            class="form-control col-6 mr-3"
                            placeholder="filename"
                            type="text"
                        />
                        <button
                            class="btn btn-outline-dark col-5"
                            style="width:auto"
                            @click="saveToJson"
                        >
                            Export
                        </button>
                    </div>
                    <small class="text-center form-text text-muted mb-3">
                        Save a copy which can be imported later
                    </small>
                    <div class="form-group row mb-0">
                        <input
                            v-model="exportICal"
                            class="form-control col-6 mr-3"
                            placeholder="filename"
                            type="text"
                        />
                        <button class="btn btn-outline-dark col-5" @click="saveToIcal">
                            Export iCal
                        </button>
                    </div>
                    <small class="form-text text-muted mb-1 text-center">
                        Google/Apple calendar support iCal files
                    </small>
                </li>
                <li class="list-group-item">
                    <button class="btn btn-outline-primary w-100" @click="print">
                        Print
                    </button>
                </li>
                <li class="list-group-item"></li>
            </ul>
        </nav>

        <palette v-else-if="sideBar.showSelectColor" :schedule="currentSchedule"></palette>

        <information v-else-if="sideBar.showInfo" :schedule-left="scheduleLeft"></information>

        <external
            v-else-if="sideBar.showExternal"
            :style="{ 'margin-left': sideBarWidth + 1 + 'vw' }"
        ></external>

        <transition name="fade">
            <div
                v-if="noti.msg.length > 0"
                id="noti"
                v-top
                class="alert mt-1 mb-0"
                :class="`alert-${noti.class}`"
                :style="
                    `width:${mobile ? 'auto' : scheduleWidth - 10 + 'vw'}; margin-left:${
                        mobile ? '11' : scheduleLeft + 5
                    }vw;`
                "
            >
                {{ noti.msg }}
                <button type="button" class="close" style="align:center" @click="clearNoti">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
        </transition>
        <div
            v-if="!sideBar.showInfo && !sideBar.showExternal"
            class="schedule"
            :style="{
                width: mobile ? (scrollable ? '200%' : '85%') : scheduleWidth + 'vw',
                'margin-left': (mobile ? 11 : scheduleLeft) + 'vw',
                'margin-right': mobile ? '1vw' : 0
            }"
        >
            <div class="container-fluid my-3">
                <div class="row justify-content-center">
                    <div v-if="generated && !generatedEmpty()" class="col">
                        <Pagination
                            :schedule-length="scheduleLength"
                            :cur-idx="tempScheduleIndex"
                            @switch_page="switchPage"
                        ></Pagination>
                    </div>
                </div>
            </div>
            <grid-schedule :schedule="currentSchedule" @editEvent="editEvent"></grid-schedule>
            <v-footer id="app-footer" dark height="auto">
                <v-card class="flex" flat tile>
                    <v-card-title class="teal">
                        <strong class="subheading"
                            >Get connected with us and let us hear your voice!
                        </strong>

                        <v-spacer></v-spacer>
                        <a
                            style="color:inherit;text-decoration: none;"
                            target="_blank"
                            href="https://github.com/awesome-schedule/Awesome-SchedulAR"
                        >
                            <v-btn
                                class="mx-3"
                                title="Checkout our GitHub site to watch/star/fork!"
                                dark
                                icon
                            >
                                <v-icon size="24px">fab fa-github</v-icon>
                            </v-btn>
                        </a>

                        <a
                            style="color:inherit;text-decoration: none;"
                            target="_blank"
                            href="https://github.com/awesome-schedule/Awesome-SchedulAR/issues"
                        >
                            <v-btn class="mx-3" title="File an issue on GitHub" dark icon>
                                <v-icon size="24px">fas fa-exclamation-circle</v-icon>
                            </v-btn>
                        </a>
                        <a
                            style="color:inherit;text-decoration: none;"
                            target="_blank"
                            href="https://www.youtube.com/watch?v=GFKAmRvqwkg"
                        >
                            <v-btn class="mx-3" title="Watch our video on YouTube" dark icon
                                ><v-icon size="22px">fab fa-youtube</v-icon>
                            </v-btn>
                        </a>
                        <a
                            style="color:inherit;text-decoration: none;"
                            target="_blank"
                            href="https://docs.google.com/forms/d/e/1FAIpQLScsXZdkFFIljwyhuyAOwjGhEbq_LzY-POxEyJsK_jLrBIUmvw/viewform"
                        >
                            <v-btn
                                class="mx-3"
                                title="Fill out a survey to make us better"
                                dark
                                icon
                                ><v-icon size="24px">fas fa-poll</v-icon>
                            </v-btn>
                        </a>
                    </v-card-title>

                    <v-card-actions class="grey darken-3 justify-center">
                        &copy;2019&nbsp;—&nbsp;<strong>Awesome Schedule</strong>
                    </v-card-actions>
                </v-card>
            </v-footer>
        </div>
    </div>
</template>

<script lang="ts" src="./App.ts"></script>

<style scoped>
.list-group-item {
    background-color: #f8f8f8;
}
</style>

<style>
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.4s;
}
.fade-enter, .fade-leave-to /* .fade-leave-active below version 2.1.8 */ {
    opacity: 0;
}
.tab-icon {
    font-size: 1.8vw;
    margin-left: 20%;
    color: #888888;
}
.tab-icon:hover {
    color: #444444;
}
.tab-icon:active {
    color: #bbbbbb;
}
.tab-icon-active {
    color: black;
}

.click-icon {
    cursor: pointer;
}
.click-icon:hover {
    color: #6f6f6f;
}
.click-icon:active {
    color: #cbcbcb;
}
.icon-disabled {
    color: #999999;
}

.sidebar {
    position: fixed;
    top: 0;
    bottom: 0;
    z-index: 100; /* Behind the navbar */
    box-shadow: inset -1px 0 0 rgba(0, 0, 0, 0.1);
    overflow-y: auto;
    left: 3vw;
    width: 19vw;
    scrollbar-width: thin !important;
}

.tab-bar {
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    z-index: 100; /* Behind the navbar */
    padding: 26px 0 0;
    box-shadow: inset -1px 0 0 rgba(0, 0, 0, 0.1);
}
.nav-btn {
    border-radius: 0 !important;
    width: 100%;
    color: white !important;
}

.filter-add:hover {
    background-color: rgba(223, 223, 223, 0.5);
}

.sort-option {
    cursor: pointer;
}

@media print {
    @page {
        size: A4 portrait;
        page-break-before: avoid;
        margin: 0.8cm 0.8cm 0.8cm 0.8cm;
    }
    .sidebar {
        display: none !important;
    }
    nav {
        display: none !important;
    }
    .tab-bar {
        display: none !important;
    }
    div .schedule {
        width: calc(100vw - 1.6cm) !important;
        height: calc(100vw - 0.8cm) !important;
        margin: 0 0.8cm 0.8cm 0.8cm !important;
    }
    div #noti {
        display: none !important;
    }
    #app-footer {
        display: none !important;
    }
}

@media (max-width: 600px) {
    .sidebar {
        position: fixed;
        top: 0;
        bottom: 0;
        z-index: 10; /* Behind the navbar */
        box-shadow: inset -1px 0 0 rgba(0, 0, 0, 0.1);
        overflow-y: auto;
        left: 10vw !important;
        width: 75vw !important;
        scrollbar-width: thin !important;
    }

    .tab-icon {
        font-size: 6vw;
        margin-left: 20%;
        color: #5e5e5e;
    }

    .tab-icon-active {
        color: #1f1f1f;
    }
}

.sidebar::-webkit-scrollbar {
    width: 5px;
}

.sidebar::-webkit-scrollbar-thumb {
    width: 5px;
    background-color: #ccc;
}

.btn-days {
    width: 100%;
}

.btn-days .btn {
    border-radius: 0;
    padding: 0.25rem 0.25rem;
}
</style>
