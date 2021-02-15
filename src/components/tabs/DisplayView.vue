<template>
    <nav class="bg-light sidebar">
        <div class="btn bg-info nav-btn">Schedule Settings</div>
        <div
            class="form-group row no-gutters mt-2 mb-0 mx-2"
            title="Schedule grid earlier than this time won't be displayed if you don't have any class before that time"
        >
            <label for="schedule-start" class="col-lg-6 pt-1 pb-0 col-form-label">
                Schedule Start
            </label>
            <div class="col-lg-6">
                <input
                    id="schedule-start"
                    v-model="display.earliest"
                    type="time"
                    min="0:00"
                    max="12:00"
                    class="form-control form-control-sm"
                />
            </div>
        </div>
        <div
            class="form-group row no-gutters mb-0 mx-2"
            title="Schedule grid later than this time won't be displayed if you don't have any class before that time"
        >
            <label for="schedule-end" class="col-lg-6 pt-1 pb-0 col-form-label">Schedule End</label>
            <div class="col-lg-6">
                <input
                    id="schedule-end"
                    v-model="display.latest"
                    type="time"
                    min="12:00"
                    max="23:59"
                    class="form-control form-control-sm"
                />
            </div>
        </div>
        <div
            class="form-group row no-gutters mb-0 mx-2"
            title="Height of the cells containing classes on the schedule grid"
        >
            <label for="class-height" class="col-lg-6 pt-1 pb-0 col-form-label">Class Height</label>
            <div class="col-lg-6">
                <input
                    id="class-height"
                    v-model.number="display.fullHeight"
                    min="1"
                    step="1"
                    max="100"
                    type="number"
                    class="form-control form-control-sm"
                />
            </div>
        </div>
        <div
            class="form-group row no-gutters mb-0 mx-2"
            title="height of an empty cell. You can specify a smaller value to compress empty space"
        >
            <label for="grid-height" class="col-lg-6 pt-1 pb-0 col-form-label">Grid Height</label>
            <div class="col-lg-6">
                <input
                    id="grid-height"
                    v-model.number="display.partialHeight"
                    min="1"
                    step="1"
                    max="100"
                    type="number"
                    class="form-control form-control-sm"
                />
            </div>
        </div>
        <div
            class="form-group row no-gutters mb-0 mx-2"
            title="Width of the schedule as a percentage relative to the parent container"
        >
            <label for="schedule-width" class="col-lg-6 pt-1 pb-0 col-form-label">Width</label>
            <div class="col-lg-6">
                <input
                    id="schedule-width"
                    v-model.number="display.width"
                    min="10"
                    step="5"
                    max="1000"
                    type="number"
                    class="form-control form-control-sm"
                />
            </div>
        </div>
        <div class="form-group row no-gutters mt-0 mb-1 mx-2">
            <div class="col-md-6">
                <label for="displayWeekend" class="m-0">Show Weekends</label>
            </div>
            <div class="col-md-6">
                <div class="custom-control custom-checkbox ml-1">
                    <input
                        id="displayWeekend"
                        v-model="display.showWeekend"
                        type="checkbox"
                        class="custom-control-input"
                    />
                    <label for="displayWeekend" class="custom-control-label"></label>
                </div>
            </div>
        </div>
        <div class="form-group row no-gutters mt-0 mb-1 mx-2">
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
        <div class="form-group row no-gutters mt-0 mb-1 mx-2">
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
        <div class="form-group row no-gutters mt-0 mb-1 mx-2">
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
        <div class="form-group row no-gutters mt-0 mb-1 mx-2">
            <div class="col-md-6">
                <label
                    for="showSuffix"
                    class="m-0"
                    title="Show class type, e.g. lecture, lab, studio, etc."
                    >Show Suffix
                </label>
            </div>
            <div class="col-md-6">
                <div class="custom-control custom-checkbox ml-1">
                    <input
                        id="showSuffix"
                        v-model="display.showSuffix"
                        type="checkbox"
                        class="custom-control-input"
                    />
                    <label for="showSuffix" class="custom-control-label"></label>
                </div>
            </div>
        </div>
        <div class="form-group row no-gutters mt-0 mb-2 mx-2">
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
        <div class="btn bg-info nav-btn">Course Search</div>
        <div class="mx-2 my-2">
            <label for="num-search-results"> Max number of search results </label>
            <div class="mb-2">
                <input
                    id="num-search-results"
                    v-model.number="display.numSearchResults"
                    class="form-control form-control-sm"
                    type="number"
                    min="1"
                    step="1"
                    max="20"
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
                    Show description on class list
                </label>
            </div>
        </div>
        <div class="btn bg-info nav-btn">Advanced Features</div>
        <ul class="list-group list-group-flush mx-1">
            <li class="list-group-item pb-1 pt-0">
                <div
                    class="form-group my-1"
                    title="If this number is too large, your browser may crash"
                >
                    <label for="num-schedule">Max number of schedules</label>
                    <input
                        id="num-schedule"
                        v-model.number="display.maxNumSchedules"
                        type="number"
                        min="1000"
                        step="1"
                        max="2000000"
                        class="form-control form-control-sm"
                    />
                </div>
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
                <div class="custom-control custom-checkbox">
                    <input
                        id="enable-log"
                        v-model="display.enableLog"
                        type="checkbox"
                        class="custom-control-input"
                    />
                    <label for="enable-log" class="custom-control-label">
                        Enable Log History
                    </label>
                </div>
            </li>
            <li class="list-group-item">
                <button
                    class="btn btn-outline-info mb-1 w-100"
                    @click="selectSemester(semester.currentSemester, true)"
                >
                    Update Semester Data
                </button>
                <small class="text-center form-text text-muted">
                    Last update: {{ semester.lastUpdate }}
                </small>
            </li>
            <li class="list-group-item">
                <button class="btn btn-outline-danger w-100" @click="clearCache()">
                    Reset All and Clean
                </button>
            </li>
        </ul>
        <template v-if="showRenderingOptions">
            <div class="btn bg-info nav-btn mb-2">Advanced Rendering Features</div>
            <div class="form-group row no-gutters my-0 mx-3">
                <label for="ISMethod" class="col-lg-6 pt-1 pb-0 col-form-label">IS Method</label>
                <div class="col-lg-6">
                    <input
                        id="ISMethod"
                        v-model.number="options.ISMethod"
                        min="1"
                        step="1"
                        max="2"
                        type="number"
                        class="form-control form-control-sm"
                    />
                </div>
            </div>
            <div class="form-group row no-gutters my-0 mx-3">
                <label for="istolerance" class="col-lg-6 pt-1 pb-0 col-form-label"
                    >IS Tolerance</label
                >
                <div class="col-lg-6">
                    <input
                        id="istolerance"
                        v-model.number="options.isTolerance"
                        min="-1"
                        step="1"
                        max="100"
                        type="number"
                        class="form-control form-control-sm"
                    />
                </div>
            </div>
            <div class="form-group row no-gutters my-1 mx-3">
                <div class="col-md-6">
                    <label for="applyDFS" class="m-0">Apply DFS</label>
                </div>
                <div class="col-md-6">
                    <div class="custom-control custom-checkbox ml-1">
                        <input
                            id="applyDFS"
                            v-model.number="options.applyDFS"
                            type="checkbox"
                            class="custom-control-input"
                        />
                        <label for="applyDFS" class="custom-control-label"></label>
                    </div>
                </div>
            </div>
            <div class="form-group row no-gutters my-0 mx-3">
                <label for="tolerance" class="col-lg-6 pt-1 pb-0 col-form-label"
                    >DFS Tolerance</label
                >
                <div class="col-lg-6">
                    <input
                        id="tolerance"
                        v-model.number="options.tolerance"
                        min="-1"
                        step="1"
                        max="100"
                        type="number"
                        class="form-control form-control-sm"
                    />
                </div>
            </div>
            <div class="form-group row no-gutters my-0 mx-3">
                <label for="LPIters" class="col-lg-6 pt-1 pb-0 col-form-label">LP Max Iters</label>
                <div class="col-lg-6">
                    <input
                        id="LPIters"
                        v-model.number="options.LPIters"
                        min="0"
                        step="1"
                        max="100"
                        type="number"
                        class="form-control form-control-sm"
                    />
                </div>
            </div>
            <div class="form-group row no-gutters my-0 mx-3">
                <label for="LPModel" class="col-lg-6 pt-1 pb-0 col-form-label">LP Model</label>
                <div class="col-lg-6">
                    <input
                        id="LPModel"
                        v-model.number="options.LPModel"
                        min="1"
                        step="1"
                        max="2"
                        type="number"
                        class="form-control form-control-sm"
                    />
                </div>
            </div>
            <div class="form-group row no-gutters my-1 mx-3">
                <div class="col-md-6">
                    <label for="showFixed" class="m-0">Show Fixed</label>
                </div>
                <div class="col-md-6">
                    <div class="custom-control custom-checkbox ml-1">
                        <input
                            id="showFixed"
                            v-model.number="options.showFixed"
                            type="checkbox"
                            class="custom-control-input"
                        />
                        <label for="showFixed" class="custom-control-label"></label>
                    </div>
                </div>
            </div>
        </template>
    </nav>
</template>

<script lang="ts" src="./DisplayView.ts"></script>
