<template>
    <nav class="bg-light sidebar">
        <button class="btn btn-info nav-btn">
            Fuzzy Search
            <span class="badge badge-secondary">Beta</span>
        </button>
        <vue-typeahead-bootstrap
            v-model="query"
            :data="queryTypes"
            :minMatchingChars="1"
            size="sm"
            placeholder="Title/Topic/Room/Prof./Desc."
            class="mt-2"
            @keyup.esc="closeClassList()"
            @keyup.enter="getClass()"
        >
            <template slot="append">
                <div
                    v-if="loading"
                    class="spinner-border my-auto text-primary mx-1"
                    style="width: 1.4rem; height: 1.4rem"
                    role="status"
                >
                    <span class="sr-only">Loading...</span>
                </div>
                <span v-else class="input-group-text px-2 click-icon" @click="getClass()">
                    <i class="fas fa-search"></i>
                </span>
            </template>
        </vue-typeahead-bootstrap>

        <div v-if="inputCourses.length" ref="classList" class="card card-body p-1">
            <ClassList
                ref="enteringClassList"
                :courses="inputCourses"
                :matches="inputMatches"
                :schedule="schedule.currentSchedule"
                :is-entering="true"
                :show-classlist-title="display.showClasslistTitle"
                :expand-on-entering="display.expandOnEntering"
                @update-course="updateCourse"
                @course-modal="modal.showCourseModal($event.crs, $event.match)"
                @close="closeClassList()"
            ></ClassList>
        </div>
        <div v-else-if="query.length" class="mt-2 mx-2">
            Input too short or no results
        </div>
        <div v-else class="mx-3 my-2">
            <div class="form-group row no-gutters mt-0 mb-1 mx-2">
                <div>
                    <label for="realtime" class="m-0"><small>Real Time</small></label>
                </div>
                <div>
                    <div class="custom-control custom-checkbox ml-1">
                        <input
                            id="realtime"
                            v-model="realtime"
                            type="checkbox"
                            class="custom-control-input"
                        />
                        <label for="realtime" class="custom-control-label"></label>
                    </div>
                </div>
            </div>
            <ol class="pl-2">
                <li class="mb-2 pl-1">
                    You should use fuzzy search only when you want do an approxiate matching. If you
                    know exactly what your target course's number/title/etc. is, please use the
                    ordinary search instead.
                </li>
                <li class="mb-2 pl-1">
                    By default, Plannable will match the title, topic, description and professor name with a predefined set of weights, which may not be always ideal. Therefore, it is recommended that you specify the field to search. For example, you can use "<strong>:title comp arch</strong>" to match only the titles of each course. 
                </li>
                <li class="mb-2 pl-1">
                    Searching for course numbers (e.g. CS 2102) is not supported here.
                </li>
                <li class="mb-2 pl-1">
                    If your computer is too slow to run realtime search, you can uncheck the
                    realtime checkbox. To search in non-realtime mode, type your query and press
                    enter or click the search icon.
                </li>
            </ol>
        </div>
    </nav>
</template>

<script lang="ts" src="./FuzzyView.ts"></script>
