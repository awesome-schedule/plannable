<template>
    <nav class="bg-light sidebar">
        <div class="btn bg-info nav-btn">
            Schedule Settings
        </div>
        <form class="mx-2">
            <div
                class="form-group row no-gutters mt-2 mb-0"
                title="Schedule grid earlier than this time won't be displayed if you don't have any class before that time"
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
                class="form-group row no-gutters mb-0"
                title="Schedule grid later than this time won't be displayed if you don't have any class before that time"
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
            <div class="form-group row no-gutters mb-0" title="height of a class on schedule">
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
                class="form-group row no-gutters mb-0"
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
            <div class="form-group row no-gutters mt-0 mb-1">
                <div class="col-md-6"><label for="displayTime" class="m-0">Show Time</label></div>
                <div class="col-md-6">
                    <div class="custom-control custom-checkbox ml-1">
                        <input
                            id="displayTime"
                            v-model="display.showTime"
                            type="checkbox"
                            class="custom-control-input"
                        />
                        <label for="displayTime" class="custom-control-label"></label>
                    </div>
                </div>
            </div>
            <div class="form-group row no-gutters mt-0 mb-1">
                <div class="col-md-6"><label for="displayRoom" class="m-0">Show Room</label></div>
                <div class="col-md-6">
                    <div class="custom-control custom-checkbox ml-1">
                        <input
                            id="displayRoom"
                            v-model="display.showRoom"
                            type="checkbox"
                            class="custom-control-input"
                        />
                        <label for="displayRoom" class="custom-control-label"></label>
                    </div>
                </div>
            </div>
            <div class="form-group row no-gutters mt-0 mb-1">
                <div class="col-md-6">
                    <label for="displayInstructor" class="m-0">Show Instructor</label>
                </div>
                <div class="col-md-6">
                    <div class="custom-control custom-checkbox ml-1">
                        <input
                            id="displayInstructor"
                            v-model="display.showInstructor"
                            type="checkbox"
                            class="custom-control-input"
                        />
                        <label for="displayInstructor" class="custom-control-label"></label>
                    </div>
                </div>
            </div>
            <div class="form-group row no-gutters mt-0 mb-2">
                <div class="col-lg-6">
                    <label for="displayInstructor" class="m-0">Time Options</label>
                </div>
                <div class="col-lg-6">
                    <div class="custom-control custom-radio custom-control-inline">
                        <input
                            id="hr12"
                            v-model="display.standard"
                            :value="true"
                            type="radio"
                            class="custom-control-input"
                        />
                        <label class="custom-control-label" for="hr12">12</label>
                    </div>
                    <div class="custom-control custom-radio custom-control-inline">
                        <input
                            id="hr24"
                            v-model="display.standard"
                            :value="false"
                            type="radio"
                            class="custom-control-input"
                        />
                        <label class="custom-control-label" for="hr24">24</label>
                    </div>
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
            Course Search
        </div>
        <li class="list-group-item mb-0" style="border-bottom: 0">
            <label for="num-search-results">
                Max number of search results
            </label>
            <div class="mr-5 mb-2">
                <input
                    id="num-search-results"
                    v-model.number="display.numSearchResults"
                    class="form-control form-control-sm"
                    type="number"
                    min="1"
                    step="1"
                />
            </div>
            <div class="custom-control custom-checkbox">
                <input
                    id="exp-on-entering"
                    v-model="display.expandOnEntering"
                    type="checkbox"
                    class="custom-control-input"
                />
                <label for="exp-on-entering" class="custom-control-label">
                    Expand all when searching
                </label>
            </div>
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
        <div class="btn bg-info nav-btn">
            Advanced Features
        </div>
        <ul class="list-group list-group-flush mx-1">
            <li class="list-group-item">
                <div class="custom-control custom-checkbox">
                    <input
                        id="enable-log"
                        v-model="display.enableLog"
                        type="checkbox"
                        class="custom-control-input"
                    />
                    <label for="enable-log" class="custom-control-label">
                        Enable log history
                    </label>
                </div>
                <div class="custom-control custom-checkbox">
                    <input
                        id="enable-fuzzy"
                        v-model="display.enableFuzzy"
                        type="checkbox"
                        class="custom-control-input"
                    />
                    <label for="enable-fuzzy" class="custom-control-label">
                        Enable fuzzy search
                    </label>
                </div>
            </li>
            <li class="list-group-item">
                <button
                    class="btn btn-outline-info mb-1 w-100"
                    @click="loadProfile(profile.current, true)"
                >
                    Update Semester Data
                </button>
                <small class="text-center form-text text-muted">
                    Last update: {{ semester.lastUpdate }}
                </small>
            </li>
            <li class="list-group-item">
                <button class="btn btn-outline-danger w-100" @click="schedule.clearCache()">
                    Reset All and Clean
                </button>
            </li>
        </ul>
    </nav>
</template>

<script lang="ts" src="./DisplayView.ts"></script>
