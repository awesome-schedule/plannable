<template>
    <nav class="d-block bg-light sidebar">
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
        <!-- <div v-if="mobile" class="custom-control custom-checkbox mb-3 ml-3">
            <input id="scroll" v-model="scrollable" type="checkbox" class="custom-control-input" />
            <label for="scroll" class="custom-control-label">
                scrollable
            </label>
        </div> -->
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
                    @click="$parent.selectSemester($parent.currentSemester.id, undefined, true)"
                >
                    Update Semester Data
                </button>
                <small class="text-center form-text text-muted">
                    Last update: {{ $parent.lastUpdate }}
                </small>
            </li>
            <li class="list-group-item">
                <button class="btn btn-outline-danger w-100" @click="$parent.clearCache">
                    Reset All and Clean
                </button>
            </li>
        </ul>
    </nav>
</template>

<script lang="ts" src="./DisplayView.ts"></script>

<style scoped>
.list-group-item {
    background-color: #f8f8f8;
}
</style>
