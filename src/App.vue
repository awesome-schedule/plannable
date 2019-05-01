<template>
    <div id="app" style="width:100%" @change="onDocChange">
        <section-modal :semester="currentSemester" :section="modalSection"></section-modal>
        <course-modal :course="modalCourse"></course-modal>
        <!-- Tab Icons Start (Leftmost bar) -->
        <nav
            class="d-block bg-light tab-bar"
            :style="{
                width: sideBarWidth + 'vw',
                'max-height': navHeight + 'px'
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
            <div
                title="What's happening"
                :class="{ 'tab-icon-active': sideBar.showExternal }"
                class="tab-icon mb-4"
                @click="switchSideBar('showExternal')"
            >
                <i class="fas fa-bullhorn"></i>
            </div>
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
                    placeholder="Title/Number/Topic/Professor"
                    @input="getClass($event.target.value)"
                    @keyup.esc="closeClassList"
                />
                <div class="input-group-append">
                    <span
                        class="input-group-text px-2"
                        style="pointer: cursor"
                        @click="closeClassList"
                        ><i
                            v-if="isEntering && sideBar.showSelectClass"
                            class="fas fa-times click-icon"
                        >
                        </i>
                        <i v-else class="fas fa-search click-icon"></i>
                    </span>
                </div>
            </div>

            <div v-if="isEntering" ref="classList" class="card card-body p-1">
                <ClassList
                    ref="enteringClassList"
                    :courses="inputCourses"
                    :schedule="currentSchedule"
                    :is-entering="isEntering"
                    :show-classlist-title="showClasslistTitle"
                    :generated="generated"
                    :multi-select="multiSelect"
                    @update_course="updateCourse"
                    @close="closeClassList"
                    @trigger-classlist-modal="showCourseModal"
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
                        :show-classlist-title="showClasslistTitle"
                        :generated="generated"
                        :multi-select="multiSelect"
                        @update_course="updateCourse"
                        @remove_course="removeCourse"
                        @trigger-classlist-modal="showCourseModal"
                    ></ClassList>
                    <div class="btn-group mt-3" role="group" style="width:100%">
                        <button
                            type="button"
                            class="btn btn-outline-info"
                            @click="generateSchedules"
                        >
                            Generate
                        </button>
                        <button class="btn btn-outline-info" @click="clear">
                            Clean All
                        </button>
                    </div>
                    <div class="custom-control custom-checkbox mt-2 mx-2">
                        <input
                            id="multiSelect"
                            v-model="multiSelect"
                            type="checkbox"
                            class="custom-control-input"
                            @change="currentSchedule.computeSchedule(multiSelect)"
                        />
                        <label
                            class="custom-control-label"
                            for="multiSelect"
                            title="render all selected sections (except for 'any section')"
                        >
                            Show Multiple Section
                        </label>
                    </div>
                </div>
            </div>
            <div class="btn bg-info nav-btn mt-2" style="color:white">
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
            <div class="btn bg-info nav-btn" style="color:white">
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
                    <div
                        class="custom-control custom-checkbox"
                        title="Combine sections ocurring at the same time"
                    >
                        <input
                            id="comb-sec"
                            v-model="combineSections"
                            type="checkbox"
                            class="custom-control-input"
                        />
                        <label class="custom-control-label" for="comb-sec">Combine Sections</label>
                    </div>
                </li>
                <li
                    class="list-group-item px-3"
                    title="Note that you can drag sort options to change their priority in fallback mode"
                >
                    Sort According to
                </li>
                <draggable
                    v-model="sortOptions.sortBy"
                    handle=".drag-handle"
                    @start="drag = true"
                    @end="
                        drag = false;
                        if (sortOptions.mode == 0) changeSorting(undefined);
                    "
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
                                @change="changeSorting(undefined)"
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
                <li class="list-group-item">
                    <button
                        type="button"
                        class="btn btn-outline-info"
                        style="width:100%"
                        @click="generateSchedules"
                    >
                        Apply
                    </button>
                </li>
                <div class="btn bg-info nav-btn" style="color:white">
                    Advanced
                </div>
                <li class="list-group-item pb-0">
                    <div class="form-group">
                        <label for="num-schedule">Max number of schedules</label>
                        <input
                            id="num-schedule"
                            v-model.number="maxNumSchedules"
                            type="number"
                            class="form-control"
                        />
                        <small class="form-text text-muted"
                            >May crash your browser if too big</small
                        >
                    </div>
                </li>
            </ul>
        </nav>

        <nav v-else-if="sideBar.showSetting" class="d-block bg-light sidebar">
            <div class="btn bg-info nav-btn" style="color:white">
                Schedule Display settings
            </div>
            <form class="mx-2">
                <div
                    class="form-group row no-gutters mt-2 mb-1"
                    title="Schedule grid earlier than this time won't be displayed if you don't have any class"
                >
                    <label for="schedule-start" class="col-lg-6 col-form-label"
                        >Schedule Start</label
                    >
                    <div class="col-lg-6">
                        <input
                            id="schedule-start"
                            v-model="earliest"
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
                            v-model="latest"
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
                            v-model.number="fullHeight"
                            type="number"
                            class="form-control form-control-sm"
                        />
                    </div>
                </div>
                <div class="form-group row no-gutters mb-3" title="height of a class on schedule">
                    <label for="grid-height" class="col-lg-6 col-form-label">Grid Height</label>
                    <div class="col-lg-6">
                        <input
                            id="grid-height"
                            v-model.number="partialHeight"
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
            <div class="btn bg-info nav-btn" style="color:white">
                Display Options
            </div>
            <ul class="list-group list-group-flush mx-1">
                <li class="list-group-item">Course Display</li>
                <li class="list-group-item">
                    <div class="custom-control custom-checkbox">
                        <input
                            id="displayTime"
                            v-model="showTime"
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
                            v-model="showRoom"
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
                            v-model="showInstructor"
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
                            v-model="showClasslistTitle"
                            type="checkbox"
                            class="custom-control-input"
                        />
                        <label for="displayClasslistTitle" class="custom-control-label">
                            Show title on class list
                        </label>
                    </div>
                </li>
            </ul>
            <div class="btn bg-info nav-btn" style="color:white">
                Time Options
            </div>
            <ul class="list-group list-group-flush mx-1">
                <li>
                    <div class="btn-group my-3" role="group" style="width:100%">
                        <button
                            class="btn btn-secondary"
                            :class="{ active: standard }"
                            type="button"
                            @click="standard = true"
                        >
                            12 Hour
                        </button>
                        <button
                            class="btn btn-secondary"
                            :class="{ active: !standard }"
                            type="button"
                            @click="standard = false"
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
                </li>
                <li class="list-group-item">
                    <button class="btn btn-outline-danger w-100" @click="clearCache">
                        Reset All and Clean
                    </button>
                </li>
            </ul>
        </nav>

        <nav v-else-if="sideBar.showExport" class="d-block bg-light sidebar">
            <div class="btn bg-info nav-btn" style="color:white">
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
                </li>
                <li class="list-group-item">
                    <div class="form-group row">
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
                    <div class="form-group row">
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
                <button type="button" class="close" style="align:center" @click="noti.clear()">
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
            <grid-schedule
                :schedule="currentSchedule"
                :show-time="showTime"
                :show-room="showRoom"
                :show-instructor="showInstructor"
                :full-height="+fullHeight"
                :partial-height="+partialHeight"
                :earliest="earliest"
                :latest="latest"
                :time-option-standard="standard"
                @trigger-modal="showModal"
                @editEvent="editEvent"
            ></grid-schedule>
            <v-footer dark height="auto">
                <v-card class="flex" flat tile>
                    <v-card-title class="teal">
                        <strong class="subheading"
                            >Get connected with us and let us hear your voice!
                        </strong>

                        <v-spacer></v-spacer>

                        <v-btn
                            class="mx-3"
                            title="Checkout our GitHub site to watch/star/fork!"
                            dark
                            icon
                        >
                            <a
                                style="color:inherit;text-decoration: none;"
                                target="_blank"
                                href="https://github.com/awesome-schedule/Awesome-SchedulAR"
                            >
                                <v-icon size="24px">fab fa-github</v-icon>
                            </a>
                        </v-btn>
                        <v-btn class="mx-3" title="File an issue on GitHub" dark icon>
                            <a
                                style="color:inherit;text-decoration: none;"
                                target="_blank"
                                href="https://github.com/awesome-schedule/Awesome-SchedulAR/issues"
                            >
                                <v-icon size="24px">fas fa-exclamation-circle</v-icon>
                            </a>
                        </v-btn>
                        <v-btn class="mx-3" title="Watch our video on YouTube" dark icon>
                            <a
                                style="color:inherit;text-decoration: none;"
                                target="_blank"
                                href="https://www.youtube.com/watch?v=GFKAmRvqwkg"
                                ><v-icon size="24px">fab fa-youtube-square</v-icon></a
                            >
                        </v-btn>
                        <v-btn class="mx-3" title="Fill out a survey to make us better" dark icon>
                            <a
                                style="color:inherit;text-decoration: none;"
                                target="_blank"
                                href="https://docs.google.com/forms/d/e/1FAIpQLScsXZdkFFIljwyhuyAOwjGhEbq_LzY-POxEyJsK_jLrBIUmvw/viewform"
                                ><v-icon size="24px">fas fa-poll</v-icon></a
                            >
                        </v-btn>
                    </v-card-title>

                    <v-card-actions class="grey darken-3 justify-center">
                        &copy;2019&nbsp;—&nbsp;<strong>Awesome Schedule</strong>
                    </v-card-actions>
                </v-card>
            </v-footer>
        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator';
import ClassList from './components/ClassList.vue';
import Pagination from './components/Pagination.vue';
import GridSchedule from './components/GridSchedule.vue';
import SectionModal from './components/SectionModal.vue';
import CourseModal from './components/CourseModal.vue';
import Palette from './components/Palette.vue';
import EventView from './components/EventView.vue';
import Information from './components/Information.vue';
import External from './components/External.vue';
import draggable from 'vuedraggable';
import GithubButton from 'vue-github-button';

import 'bootstrap';
import $ from 'jquery';
import Section from './models/Section';
import Course from './models/Course';
import Schedule, { ScheduleJSON } from './models/Schedule';
import Catalog, { Semester, CatalogJSON } from './models/Catalog';
import Event from './models/Event';
import ScheduleGenerator from './algorithm/ScheduleGenerator';
import ScheduleEvaluator from './algorithm/ScheduleEvaluator';
import { loadSemesterData } from './data/CatalogLoader';
import { loadSemesterList } from './data/SemesterListLoader';
import { loadTimeMatrix, loadBuildingList } from './data/BuildingLoader';
import Notification from './models/Notification';
import { to12hr, parseTimeAsInt, timeout, savePlain, errToStr } from './models/Utils';
import Meta, { getDefaultData } from './models/Meta';
import { toICal } from './models/ICal';

// these two properties must be non-reactive,
// otherwise the reactive observer will slow down execution significantly
window.scheduleEvaluator = new ScheduleEvaluator();
// window.window.catalog = null;

@Component({
    components: {
        ClassList,
        Pagination,
        GridSchedule,
        SectionModal,
        CourseModal,
        draggable,
        Palette,
        EventView,
        Information,
        External,
        GithubButton
    }
})
export default class App extends Vue {
    [x: string]: any;

    name = 'App';

    semesters: Semester[] = [];
    currentSemester: Semester | null = null;
    currentScheduleIndex = 0;
    currentSchedule = new Schedule();

    proposedSchedules = [new Schedule()];
    proposedScheduleIndex = 0;
    /**
     * The index of the proposed schedule corresponding to the generated schedule
     */
    cpIndex = -1;
    /**
     * indicates whether the currently showing schedule is the generated schedule
     */
    generated = false;
    maxNumSchedules = 200000;

    /**
     * sidebar display status
     * show the specific sidebar when true, and hide when all false
     */
    sideBar: { [x: string]: boolean } = {
        showSelectClass: window.screen.width / window.screen.height > 1 ? true : false,
        showEvent: false,
        showFilter: false,
        showSetting: false,
        showExport: false,
        showSelectColor: false,
        showInfo: false,
        showExternal: false
    };

    // autocompletion related fields
    isEntering = false;
    inputCourses: Course[] | null = null;

    // modal object binding
    modalSection: Section | null = null;
    modalCourse: Course | null = null;

    // display options
    showTime = false;
    showRoom = true;
    showInstructor = true;
    showClasslistTitle = false;
    fullHeight = 40;
    partialHeight = 25;
    earliest = '08:00:00';
    latest = '19:00:00';
    standard = false;

    // filter settings
    /**
     * index 0 - 4: whether Mo - Tu are selected
     *
     * 6: start time, of 24 hour format
     *
     * 7: end time, of 24 hour format
     */
    timeSlots: Array<[boolean, boolean, boolean, boolean, boolean, string, string]> = [];
    allowWaitlist = true;
    allowClosed = true;
    combineSections = true;
    sortOptions = ScheduleEvaluator.getDefaultOptions();
    sortModes = ScheduleEvaluator.sortModes;

    // other
    noti = new Notification();
    navHeight = 500;
    loading = false;
    mobile = window.screen.width < 900;
    sideBarWidth = this.mobile ? 10 : 3;
    scrollable = false;
    tempScheduleIndex: number | null = null;
    drag = false;
    days = Meta.days;
    eventToEdit: Event | null = null;
    exportJson: string = 'schedule';
    exportICal: string = 'schedule';
    multiSelect: boolean = true;

    get sideBarActive() {
        for (const key in this.sideBar) {
            if (this.sideBar[key]) return true;
        }
        return false;
    }
    get scheduleLength() {
        return window.scheduleEvaluator.size();
    }
    get scheduleWidth() {
        return this.sideBarActive ? 100 - 19 - 3 - 3 : 100 - 3 - 3;
    }
    get scheduleLeft() {
        return this.sideBarActive ? 23 : 3;
    }
    /**
     * get the list of current ids, sorted in alpabetical order of the keys
     */
    get currentIds(): Array<[string, string]> {
        return Object.entries(this.currentSchedule.currentIds).sort((a, b) =>
            a[0] === b[0] ? 0 : a[0] < b[0] ? -1 : 1
        );
    }
    set proposedSchedule(schedule: Schedule) {
        // need Vue's reactivity
        this.$set(this.proposedSchedules, this.proposedScheduleIndex, schedule);
    }
    /**
     * the proposed schedule that is currently active
     */
    get proposedSchedule() {
        return this.proposedSchedules[this.proposedScheduleIndex];
    }

    @Watch('loading')
    loadingWatch() {
        if (this.mobile) {
            if (this.loading) this.noti.info('Loading...', 3600);
            else this.noti.clear();
        }
    }

    created() {
        this.navHeight = document.documentElement.clientHeight;
        this.loading = true;

        (async () => {
            // note: the order is very important
            const pay1 = await loadTimeMatrix();
            console[pay1.level](pay1.msg);
            if (pay1.payload) window.timeMatrix = pay1.payload;
            const pay2 = await loadBuildingList();
            console[pay2.level](pay2.msg);
            if (pay2.payload) window.buildingList = pay2.payload;

            const data = await loadSemesterList();
            const semesters = data.payload;
            if (data.level !== 'info') this.noti.notify(data);
            if (semesters) {
                window.semesters = this.semesters = semesters;
                this.selectSemester(0);
            }
            this.loading = false;
        })();
    }
    /**
     * whether there're schedules generated. Because script between <template>
     * tag cannot access global objects, we need a method
     */
    generatedEmpty() {
        return window.scheduleEvaluator.empty();
    }
    /**
     * switch to next/previous proposed schedule. has bound checking.
     */
    switchProposed(index: number) {
        if (index < this.proposedSchedules.length && index >= 0) {
            this.proposedScheduleIndex = index;
            this.switchSchedule(false);
        }
        this.saveStatus();
    }
    newProposed() {
        this.proposedSchedules.push(new Schedule());
        this.switchProposed(this.proposedSchedules.length - 1);
    }
    /**
     * copy the current schedule and append to the proposedSchedule array.
     * Immediately switch to the last proposed schedule.
     */
    copyCurrent() {
        const len = this.proposedSchedules.length;
        this.proposedSchedules.push(this.proposedSchedule.copy());
        this.switchProposed(len);
    }
    deleteProposed() {
        if (this.proposedSchedules.length === 1) return;
        const idx = this.proposedScheduleIndex;

        if (!confirm(`Are you sure to delete schedule ${idx + 1}?`)) return;

        // if the schedule to be deleted corresponds to generated schedules,
        // this deletion invalidates the generated schedules immediately.
        if (idx === this.cpIndex) {
            window.scheduleEvaluator.clear();
            this.cpIndex = -1;
        }
        this.proposedSchedules.splice(idx, 1);
        if (idx >= this.proposedSchedules.length) {
            this.switchProposed(idx - 1);
        } else {
            this.switchProposed(idx);
        }
        this.saveStatus();
    }
    editEvent(event: Event) {
        if (!this.sideBar.showEvent) this.switchSideBar('showEvent');
        this.eventToEdit = event;
    }
    switchSchedule(generated: boolean) {
        if (generated) {
            // dont do anything if already in "generated" mode
            // or there are no generated schedules
            // or the generated schedules do not correspond to the current schedule
            if (
                !this.generated &&
                !window.scheduleEvaluator.empty() &&
                this.cpIndex === this.proposedScheduleIndex
            ) {
                this.generated = true;
                this.proposedSchedule = this.currentSchedule;
                this.switchPage(
                    this.currentScheduleIndex === null ? 0 : this.currentScheduleIndex,
                    true
                );
            }
        } else {
            this.generated = false;
            this.currentSchedule = this.proposedSchedule;
        }
    }
    updateFilterDay(i: number, j: number) {
        this.$set(this.timeSlots[i], j, !this.timeSlots[i][j]);
    }
    switchSideBar(key: string) {
        this.getClass('');
        for (const other in this.sideBar) {
            if (other !== key) this.sideBar[other] = false;
        }
        this.sideBar[key] = !this.sideBar[key];

        if (this.sideBar.showSelectColor) this.switchSchedule(true);
    }
    onDocChange() {
        this.saveStatus();
    }
    print() {
        window.print();
    }
    clear() {
        this.currentSchedule.clean();
        this.proposedSchedule.clean();
        this.generated = false;
        window.scheduleEvaluator.clear();
        this.cpIndex = -1;
        this.saveStatus();
    }
    clearCache() {
        if (confirm('Your selected classes and schedules will be cleaned. Are you sure?')) {
            this.currentSchedule.clean();
            this.generated = false;
            window.scheduleEvaluator.clear();
            localStorage.clear();
            this.cpIndex = -1;
        }
    }
    showModal(section: Section) {
        this.modalSection = section;
        $('#modal').modal();
    }
    showCourseModal(course: Course) {
        this.modalCourse = course;
        $('#course-modal').modal();
    }
    removeCourse(key: string) {
        this.currentSchedule.remove(key);
        if (this.generated) {
            this.noti.warn(`You're editing the generated schedule!`, 3);
        } else {
            this.saveStatus();
        }
    }
    /**
     * @see Schedule.update
     */
    updateCourse(key: string, section: number, remove: boolean = false) {
        this.currentSchedule.update(key, section, true, remove);
        if (this.generated) {
            this.noti.warn(`You're editing the generated schedule!`, 3);
        } else {
            this.saveStatus();
        }
        // note: adding a course to schedule.All cannot be detected by Vue.
        // Must use forceUpdate to rerender component
        (this.$refs.selectedClassList as Vue).$forceUpdate();
        const classList = this.$refs.enteringClassList;
        if (classList instanceof Vue) (classList as Vue).$forceUpdate();
    }
    /**
     * Switch to `idx` page. If update is true, also update the pagination status.
     * @param idx
     * @param update  whether to update the pagination status
     */
    switchPage(idx: number, update = false) {
        if (0 <= idx && idx < window.scheduleEvaluator.size()) {
            this.currentScheduleIndex = idx;
            if (update) {
                this.tempScheduleIndex = idx;
            } else {
                this.tempScheduleIndex = null;
            }
            this.currentSchedule = window.scheduleEvaluator.getSchedule(idx);
            this.saveStatus();
        }
    }
    /**
     * get classes that match the input query.
     * Exit "entering" mode on falsy parameter (set `isEntering` to false)
     *
     * @see Catalog.search
     */
    getClass(query: string) {
        if (!query) {
            this.isEntering = false;
            this.inputCourses = null;
            return;
        }
        // if current schedule is displayed, switch to proposed schedule
        // because we're adding stuff to the proposed schedule
        if (this.generated) {
            this.switchSchedule(false);
        }
        this.inputCourses = window.catalog.search(query);
        this.isEntering = true;
    }
    /**
     * Select a semester and fetch all its associated data.
     *
     * This method will assign a correct Catalog object to `window.catalog`
     *
     * Then, schedules and settings will be parsed from `localStorage`
     * and assigned to relevant fields of `this`.
     *
     * If no local data is present, default values will be assigned.
     *
     * @param semesterId index or id of this semester
     * @param parsed_data
     * @param force whether to force-update semester data
     */
    async selectSemester(
        semesterId: number | string,
        parsed_data?: { [x: string]: any },
        force = false
    ) {
        // do a linear search to find the index of the semester given its string id
        if (typeof semesterId === 'string') {
            for (let i = 0; i < this.semesters.length; i++) {
                const semester = this.semesters[i];
                if (semester.id === semesterId) {
                    semesterId = i;
                    break;
                }
            }
            // not found: return
            if (typeof semesterId === 'string') return;
        }

        this.currentSemester = this.semesters[semesterId];
        this.loading = true;

        if (force) this.noti.info(`Updating ${this.currentSemester.name} data...`);
        const result = await loadSemesterData(semesterId, force);
        if (result.level !== 'info') this.noti.notify(result);
        if (result.payload) window.catalog = result.payload;

        //  if the global `Catalog` object is assigned
        if (result.payload) {
            const data = localStorage.getItem(this.currentSemester.id);

            let raw_data: { [x: string]: any } = {};
            if (parsed_data) {
                raw_data = parsed_data;
            } else if (data) {
                raw_data = JSON.parse(data);
            }

            this.generated = false;
            window.scheduleEvaluator.clear();
            this.parseLocalData(raw_data);
            this.loading = false;
        }
    }
    closeClassList() {
        (this.$refs.classSearch as HTMLInputElement).value = '';
        this.getClass('');
    }
    generateSchedules() {
        if (this.generated) this.currentSchedule = this.proposedSchedule;
        this.generated = false;

        if (this.currentSchedule.empty())
            return this.noti.warn(`There are no classes in your schedule!`);

        const status = [];
        if (!this.allowWaitlist) status.push('Wait List');
        if (!this.allowClosed) status.push('Closed');

        const timeSlots = this.computeFilter();

        // null means there's an error processing time filters. Don't continue if that's the case
        if (timeSlots === null) {
            this.noti.error(`Invalid time filter`);
            return;
        }

        if (!this.validateSortOptions()) return;

        this.loading = true;
        const generator = new ScheduleGenerator(window.catalog);
        try {
            const evaluator = generator.getSchedules(this.currentSchedule, {
                events: this.currentSchedule.events,
                timeSlots,
                status,
                sortOptions: this.sortOptions,
                combineSections: this.combineSections,
                maxNumSchedules: this.maxNumSchedules
            });
            window.scheduleEvaluator.clear();
            window.scheduleEvaluator = evaluator;
            this.saveStatus();
            this.noti.success(`${window.scheduleEvaluator.size()} Schedules Generated!`, 3);
            this.cpIndex = this.proposedScheduleIndex;
            this.switchSchedule(true);
            this.loading = false;
        } catch (err) {
            console.warn(err);
            this.generated = false;
            window.scheduleEvaluator.clear();
            this.noti.error(err.message);
            this.saveStatus();
            this.cpIndex = -1;
            this.loading = false;
        }
    }

    validateSortOptions() {
        if (!Object.values(this.sortOptions.sortBy).some(x => x.enabled)) {
            this.noti.error('You must have at least one sort option!');
            return false;
        } else if (
            Object.values(this.sortOptions.sortBy).some(x => x.name === 'distance' && x.enabled) &&
            (!window.buildingList || !window.timeMatrix)
        ) {
            this.noti.error('Building list fails to load. Please disable "walking distance"');
            return false;
        }
        return true;
    }

    changeSorting(optIdx: number) {
        if (!this.validateSortOptions()) return;
        if (optIdx !== undefined) {
            const option = this.sortOptions.sortBy[optIdx];

            if (option.enabled) {
                // disable options that are mutually exclusive to this one
                for (const key of option.exclusive) {
                    for (const opt of this.sortOptions.sortBy) {
                        if (opt.name === key) opt.enabled = false;
                    }
                }
            }
        }
        if (!window.scheduleEvaluator.empty()) {
            this.loading = true;
            window.scheduleEvaluator.changeSort(this.sortOptions, true);
            if (!this.generated) {
                this.switchSchedule(true);
            } else {
                // re-assign the current schedule
                this.currentSchedule = window.scheduleEvaluator.getSchedule(
                    this.currentScheduleIndex
                );
            }
            this.loading = false;
        }
    }

    saveStatus() {
        if (!this.currentSemester) return;

        const obj: { [x: string]: any } = Object.create(null);
        for (const field of Meta.storageFields) {
            obj[field] = this[field];
        }
        obj.storageVersion = Meta.storageVersion;
        // note: toJSON() will automatically be called if such method exists on an object
        localStorage.setItem(this.currentSemester.id, JSON.stringify(obj));
    }
    /**
     * parse schedules and settings stored locally for currentSemester.
     * Use default value for fields that do not exist on local data.
     */
    parseLocalData(raw_data: { [x: string]: any }) {
        const defaultData = getDefaultData();
        for (const field of Meta.storageFields) {
            if (field === 'currentSemester') continue;
            if (field === 'proposedSchedules') {
                // if true, we're dealing with legacy storage
                if (raw_data.proposedSchedule) {
                    this.proposedScheduleIndex = 0;
                    const s = Schedule.fromJSON(raw_data.proposedSchedule);
                    if (s) this.proposedSchedule = s;
                } else {
                    const schedules: ScheduleJSON[] | undefined = raw_data.proposedSchedules;
                    if (schedules && schedules.length) {
                        const propSchedules = [];
                        for (const schedule of schedules) {
                            const temp = Schedule.fromJSON(schedule);
                            if (temp) propSchedules.push(temp);
                        }

                        if (propSchedules.length) this.proposedSchedules = propSchedules;
                        else this.proposedSchedules = defaultData.proposedSchedules;

                        this.proposedScheduleIndex =
                            raw_data.proposedScheduleIndex === undefined
                                ? 0
                                : raw_data.proposedScheduleIndex;
                    } else {
                        this.proposedSchedules = defaultData[field];
                    }
                }
            } else if (this[field] instanceof Array) {
                const raw_arr = raw_data[field];
                if (raw_arr instanceof Array) {
                    this[field] = raw_arr;
                } else this[field] = defaultData[field];
            } else if (this[field] instanceof Object) {
                if (typeof this[field].fromJSON === 'function') {
                    const parsed = this[field].fromJSON(raw_data[field]);
                    if (parsed) this[field] = parsed;
                    else {
                        // this.noti.warn(`Fail to parse ${field}`);
                        // console.warn('failed to parse', field);
                        this[field] = defaultData[field];
                    }
                } else {
                    if (
                        Object.keys(this[field])
                            .sort()
                            .toString() ===
                        Object.keys(raw_data[field])
                            .sort()
                            .toString()
                    )
                        this[field] = raw_data[field];
                    else this[field] = defaultData[field];
                }
            } else if (typeof raw_data[field] === typeof this[field]) this[field] = raw_data[field];
            else {
                this[field] = defaultData[field];
            }
        }
        if (!this.proposedSchedule.empty()) {
            console.log('generating schedules from local data..');
            this.currentSchedule = this.proposedSchedule;
            this.generateSchedules();
        }
    }
    removeTimeSlot(n: number) {
        this.timeSlots.splice(n, 1);
    }
    addTimeSlot() {
        this.timeSlots.push([false, false, false, false, false, '', '']);
    }
    /**
     * Preprocess the time filters and convert them to array of event.
     * returns null on parsing error
     */
    computeFilter(): Event[] | null {
        const timeSlotsRecord = [];
        for (const time of this.timeSlots) {
            let days = '';
            for (let j = 0; j < 5; j++) {
                if (time[j]) days += Meta.days[j];
            }

            if (!days) continue;

            const startTime = time[5].split(':');
            const endTime = time[6].split(':');
            if (
                isNaN(+startTime[0]) ||
                isNaN(+startTime[1]) ||
                isNaN(+endTime[0]) ||
                isNaN(+endTime[1])
            ) {
                this.noti.error('Invalid time input.');
                return null;
            }
            days += ' ' + to12hr(time[5]) + ' - ' + to12hr(time[6]);
            timeSlotsRecord.push(new Event(days, false));
        }
        return timeSlotsRecord;
    }
    onUploadJson(event: { target: HTMLInputElement }) {
        const input = event.target;
        if (!input.files) return;

        const reader = new FileReader();
        reader.onload = () => {
            if (reader.result) {
                let raw_data, result;
                try {
                    result = reader.result.toString();
                    raw_data = JSON.parse(result);
                } catch (error) {
                    console.error(error);
                    this.noti.error(error.message + ': File Format Error');
                    return;
                }
                localStorage.setItem((this.currentSemester as Semester).id, result);
                const semester: Semester = raw_data.currentSemester;
                this.selectSemester(semester.id, raw_data);
            } else {
                this.noti.warn('File is empty!');
            }
        };

        try {
            reader.readAsText(input.files[0]);
        } catch (error) {
            console.warn(error);
            this.noti.error(error.message);
        }
    }
    saveToJson() {
        if (!this.currentSemester) return;

        const json = localStorage.getItem(this.currentSemester.id);
        if (json) savePlain(json, (this.exportJson ? this.exportJson : 'schedule') + '.json');
    }
    saveToIcal() {
        savePlain(
            toICal(this.currentSchedule),
            (this.exportICal ? this.exportICal : 'schedule') + '.ical'
        );
    }
}
</script>

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
}

.filter-add:hover {
    background-color: rgba(223, 223, 223, 0.5);
}

.sort-option {
    cursor: pointer;
}

@media print {
    @page {
        size: A4 landscape;
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
        height: calc(100vw - 1.6cm) !important;
        margin: 0.8cm 0.8cm 0.8cm 0.8cm !important;
    }
    div #noti {
        display: none !important;
    }
}

@media (max-width: 450px) {
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

    .nav-btn {
        border-radius: 0 !important;
        width: 100%;
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
