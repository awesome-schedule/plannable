<template>
    <nav class="bg-light sidebar">
        <button class="btn btn-info nav-btn">
            Fuzzy Search
            <span class="badge badge-secondary">Beta</span>
        </button>
        <div class="input-group mt-2">
            <input
                v-if="realtime"
                ref="classSearch"
                type="text"
                class="form-control form-control-sm"
                placeholder="Title/Topic/Prof./Desc."
                :disabled="!workerLoaded"
                @input="onInput($event.target.value)"
                @keydown.enter="getClass($event.target.value)"
                @keyup.esc="closeClassList()"
            />
            <input
                v-else
                ref="classSearch"
                type="text"
                class="form-control form-control-sm"
                placeholder="Title/Topic/Prof./Desc."
                :disabled="!workerLoaded"
                @keydown.enter="getClass($event.target.value)"
                @keyup.esc="closeClassList()"
            />
            <div class="input-group-append">
                <div
                    v-if="loading"
                    class="spinner-border my-auto text-primary mx-1"
                    style="width: 1.4rem; height: 1.4rem"
                    role="status"
                >
                    <span class="sr-only">Loading...</span>
                </div>
                <span v-else class="input-group-text px-2 click-icon">
                    <i class="fas fa-search"></i>
                </span>
            </div>
        </div>

        <div v-if="inputCourses.length" ref="classList" class="card card-body p-1">
            <ClassList
                ref="enteringClassList"
                :courses="inputCourses"
                :matches="inputMatches"
                :schedule="schedule.currentSchedule"
                :is-entering="true"
                :show-classlist-title="display.showClasslistTitle"
                :expand-on-entering="display.expandOnEntering"
                @update_course="updateCourse"
                @course_modal="modal.showCourseModal($event.crs, $event.match)"
                @close="closeClassList()"
            ></ClassList>
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
                    You should use fuzzy search only when you want do an <b>approximate</b>
                    match to your query. If you know exactly what your target course's course
                    number/title/etc., please use the ordinary search instead.
                </li>
                <li class="mb-2 pl-1">
                    Searching for course numbers (e.g. CS 2102) is not supported.
                </li>
            </ol>
        </div>
    </nav>
</template>

<script lang="ts" src="./FuzzyView.ts"></script>
