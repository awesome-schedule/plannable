<template>
    <nav class="bg-light sidebar">
        <div class="btn bg-info nav-btn">Filters</div>
        <ul class="list-group list-group-flush mx-1">
            <li class="list-group-item px-3" title="Time periods when you don't want to have class">
                No Class Time
                <div
                    style="float: right"
                    title="Click to add a time period when you don't want to have class"
                    class="click-icon px-4"
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
                        @click="updateFilterDay(i, +j)"
                    >
                        {{ day }}
                    </button>
                </div>
                <div class="form-group row no-gutters align-items-center text-center mb-2">
                    <div class="col col-5 align-self-center">
                        <input
                            v-model="value[7]"
                            type="time"
                            class="form-control form-control-sm"
                        />
                    </div>
                    <div class="col col-1 align-self-center">-</div>
                    <div class="col col-5">
                        <input
                            v-model="value[8]"
                            type="time"
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
                    @click="generateSchedules()"
                >
                    Apply
                </button>
            </li>

            <div class="btn bg-info nav-btn">Sort Priority</div>
            <li
                class="list-group-item px-3"
                title="Note that you can drag sort options to change their priority in fallback mode"
            >
                Sort According to
            </li>
            <draggable v-model="filter.sortOptions.sortBy" @end="dragEnd()">
                <div
                    v-for="(option, optIdx) in filter.sortOptions.sortBy"
                    :key="option.name"
                    class="list-group-item py-1 pl-3 pr-0"
                >
                    <div class="row no-gutters w-100">
                        <div class="col col-sm-10 drag-handle" :title="option.description">
                            <span style="cursor: pointer"> {{ option.title }} </span>
                            <span
                                v-if="!getSortOptRange(option.name)"
                                class="ml-1 text-warning"
                                :title="`Enabling this sort option has no effect, because all schedules have the same '${option.title.toLowerCase()}'`"
                            >
                                <i class="fas fa-exclamation-triangle"></i>
                            </span>
                            <div
                                v-if="filter.sortOptions.mode === 1 && option.enabled"
                                class="input-group input-group-sm"
                                style="width: 80%"
                            >
                                <div class="input-group-prepend">
                                    <span class="input-group-text">Weight</span>
                                </div>
                                <input
                                    v-model="option.weight"
                                    class="form-control"
                                    type="number"
                                    min="0.1"
                                    max="10"
                                    step="0.1"
                                />
                            </div>
                        </div>
                        <div class="col col-sm-2">
                            <i
                                class="fas mr-2 click-icon"
                                :class="option.reverse ? 'fa-arrow-down' : 'fa-arrow-up'"
                                title="Click to reverse sorting"
                                @click="
                                    option.reverse = !option.reverse;
                                    changeSorting(+optIdx);
                                "
                            ></i>
                            <div
                                class="custom-control custom-checkbox"
                                style="display: inline-block; cursor: pointer"
                            >
                                <template
                                    v-if="option.name === 'similarity' && !filter.similarityEnabled"
                                >
                                    <input
                                        :id="option.name"
                                        type="checkbox"
                                        class="custom-control-input"
                                        :value="option.name"
                                        disabled
                                    />
                                    <label
                                        class="custom-control-label"
                                        :for="option.name"
                                        title="To enable sort by similarity, please first set a reference schedule in the compare tab"
                                    ></label>
                                </template>
                                <template v-else>
                                    <input
                                        :id="option.name"
                                        v-model="option.enabled"
                                        type="checkbox"
                                        class="custom-control-input"
                                        :value="option.name"
                                        @change="changeSorting(+optIdx)"
                                    />
                                    <label
                                        class="custom-control-label"
                                        :for="option.name"
                                        title="Enable this sorting option"
                                    ></label>
                                </template>
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
            <!-- <li class="list-group-item">
                Sort configurations<br /><input
                    v-model="filter.configs.distance.threshold"
                    type="number"
                />
            </li> -->
        </ul>
    </nav>
</template>

<script lang="ts" src="./FilterView.ts"></script>
