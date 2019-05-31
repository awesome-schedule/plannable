<template>
    <nav class="bg-light sidebar-nocol">
        <div class="input-group mt-2">
            <input
                ref="classSearch"
                type="text"
                class="form-control form-control-sm"
                placeholder="Title/Number/Topic/Prof./Desc."
                @keydown.enter="getClass($event.target.value)"
                @keyup.esc="closeClassList()"
            />
            <div class="input-group-append">
                <span
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
    </nav>
</template>

<script lang="ts" src="./FuzzyView.ts"></script>
