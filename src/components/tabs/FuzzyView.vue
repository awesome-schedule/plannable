<template>
    <nav>
        <div class="input-group mt-2">
            <input
                ref="classSearch"
                type="text"
                class="form-control form-control-sm"
                placeholder="Title/Topic/Prof./Desc."
                :disabled="loading"
                @input="$event.target.value ? '' : getClass('')"
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
                <span
                    v-else
                    class="input-group-text px-2"
                    :class="{ 'click-icon': isEntering }"
                    @click="closeClassList"
                    ><i v-if="isEntering" class="fas fa-times"> </i>
                    <i v-else class="fas fa-search"></i>
                </span>
            </div>
        </div>

        <div v-if="isEntering" ref="classList" class="card card-body p-1">
            <ClassList
                ref="enteringClassList"
                :courses="inputCourses"
                :schedule="schedule.currentSchedule"
                :is-entering="isEntering"
                :show-classlist-title="display.showClasslistTitle"
                :expand-on-entering="display.expandOnEntering"
                @update_course="updateCourse"
                @course_modal="modal.showCourseModal($event)"
                @close="closeClassList()"
            ></ClassList>
        </div>
        <div v-else class="mx-3 my-4">
            Fuzzy search: Enter your search query and press ENTER to get results. Because fuzzy
            search is slow, we cannot provide real-time results. Please do not search for course
            number (e.g. 2102) here. It is not supported.
        </div>
    </nav>
</template>

<script lang="ts" src="./FuzzyView.ts"></script>
