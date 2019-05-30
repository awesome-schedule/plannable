<template>
    <nav class="bg-light sidebar">
        <div id="semester" class="btn bg-info nav-btn mt-0">
            <div v-if="isEditingEvent">Edit Event</div>
            <div v-else>Add Event</div>
        </div>
        <form class="mt-2 mx-2">
            <div class="form-group row no-gutters mb-1">
                <label for="event-title" class="col-lg-5 col-form-label">Title</label>
                <div class="col-lg-7">
                    <input
                        id="event-title"
                        v-model="eventTitle"
                        type="text"
                        class="form-control form-control-sm"
                    />
                </div>
            </div>
            <div class="form-group row no-gutters mb-1">
                <label for="event-from" class="col-lg-5 col-form-label">Start</label>
                <div class="col-lg-7">
                    <input
                        id="event-from"
                        v-model="eventTimeFrom"
                        type="time"
                        style="-webkit-appearance:button"
                        class="form-control form-control-sm"
                    />
                </div>
            </div>
            <div class="form-group row no-gutters mb-1">
                <label for="event-to" class="col-lg-5 col-form-label">End</label>
                <div class="col-lg-7">
                    <input
                        id="event-to"
                        v-model="eventTimeTo"
                        type="time"
                        style="-webkit-appearance:button"
                        class="form-control form-control-sm"
                    />
                </div>
            </div>
            <div class="btn-group btn-days mb-2" role="group">
                <button
                    v-for="(day, idx) in days"
                    :key="idx"
                    class="btn btn-outline-secondary"
                    :class="{ active: eventWeek[idx] }"
                    type="button"
                    @click="updateDay(idx)"
                >
                    {{ day }}
                </button>
            </div>
            <div class="form-group row no-gutters mb-1">
                <label for="event-loc" class="col-lg-5 col-form-label">Location</label>
                <div class="col-lg-7">
                    <input
                        id="event-loc"
                        v-model="eventRoom"
                        type="text"
                        class="form-control form-control-sm"
                    />
                </div>
            </div>
        </form>
        <textarea
            v-model="eventDescription"
            class="my-2 mx-auto form-control"
            style="width: 98%"
            placeholder="Description"
        ></textarea>
        <button
            v-if="!isEditingEvent"
            class="btn btn-outline-secondary ml-1"
            style="width:98%"
            @click="addEvent()"
        >
            Add
        </button>
        <div v-if="isEditingEvent" class="btn-group" role="group" style="width:100%">
            <button type="button" class="btn btn-outline-info" @click="endEditEvent()">
                Edit
            </button>
            <button type="button" class="btn btn-outline-info" @click="cancelEvent()">
                Cancel
            </button>
            <button type="button" class="btn btn-outline-danger" @click="deleteEvent()">
                Delete
            </button>
        </div>
    </nav>
</template>

<script lang="ts" src="./EventView.ts"></script>
