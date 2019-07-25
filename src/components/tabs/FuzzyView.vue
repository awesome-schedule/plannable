<template>
    <nav class="bg-light sidebar">
        <div class="input-group mt-2">
            <input
                ref="classSearch"
                type="text"
                class="form-control form-control-sm"
                placeholder="Title/Topic/Prof./Desc."
                :disabled="!workerLoaded"
                @input="$event.target.value || getClass('')"
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
                @course_modal="modal.showCourseModal($event)"
                @close="closeClassList()"
            ></ClassList>
        </div>
        <div v-else class="mx-3 my-4">
            Fuzzy search (beta): Enter your search query and press ENTER to get results. Because
            fuzzy search is slow, we cannot provide real-time results. Please do not search for
            course number (e.g. 2102) here. It is not supported. This feature is memory intensive,
            which will cause some browsers to crash. Before enabling this feature, please make sure
            that your computer has at least 8GB RAM and you are using Chrome or FireFox.

            <button
                v-if="!workerLoaded"
                class="btn btn-outline-info w-100 mt-2"
                @click="initWorker()"
            >
                Enable
            </button>
            <button
                v-else
                class="btn btn-outline-info w-100 mt-2"
                title="Release worker and reclaim memory"
                @click="disposeWorker()"
            >
                Release
            </button>
        </div>
    </nav>
</template>

<script lang="ts" src="./FuzzyView.ts"></script>
