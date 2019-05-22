<template>
    <nav class="d-block bg-light sidebar">
        <div class="btn bg-info nav-btn">
            Filters
        </div>
        <ul class="list-group list-group-flush mx-1">
            <li class="list-group-item px-3" title="Time periods when you don't want to have class">
                No Class Time
                <div
                    style="float: right"
                    title="Click to add a time period when you don't want to have class"
                    class="filter-add px-4"
                    @click="filter.addTimeSlot()"
                >
                    <i class="fas fa-plus"></i>
                </div>
            </li>
            <li v-for="(value, i) in filter.timeSlots" :key="i" class="list-group-item p-1">
                <div class="btn-group btn-days my-2" role="group">
                    <button
                        v-for="(day, j) in days"
                        :key="j"
                        :class="'btn btn-outline-secondary' + (value[j] ? ' active' : '')"
                        type="button"
                        @click="filter.updateFilterDay(i, j)"
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
                            @click="filter.removeTimeSlot(i)"
                        ></i>
                    </div>
                </div>
            </li>
            <li class="list-group-item">
                <div class="custom-control custom-checkbox my-1">
                    <input
                        id="awt"
                        v-model="filter.allowWaitlist"
                        type="checkbox"
                        class="custom-control-input"
                    />
                    <label class="custom-control-label" for="awt">Allow Wait List</label>
                </div>
                <div class="custom-control custom-checkbox">
                    <input
                        id="ac"
                        v-model="filter.allowClosed"
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
                    @click="$parent.generateSchedules()"
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
            <draggable v-model="filter.sortOptions.sortBy" handle=".drag-handle" @end="dragEnd()">
                <div
                    v-for="(option, optIdx) in filter.sortOptions.sortBy"
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
                                    filter.changeSorting(optIdx);
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
                                    @change="filter.changeSorting(optIdx)"
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
                <template v-for="mode in filter.sortModes">
                    <div :key="'sm' + mode.mode" class="custom-control custom-radio">
                        <input
                            :id="'sm' + mode.mode"
                            v-model.number="filter.sortOptions.mode"
                            type="radio"
                            :value="mode.mode"
                            class="custom-control-input"
                            @change="filter.changeSorting()"
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
</template>

<script lang="ts" src="./FilterView.ts"></script>
