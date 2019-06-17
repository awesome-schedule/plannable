<template>
    <nav class="bg-light sidebar">
        <div id="semester" class="btn bg-info nav-btn mt-0">
            <div v-if="currentSelectedEvent">Edit Event</div>
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
                    @click="updateDay(+idx)"
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
        <div v-if="currentSelectedEvent" class="btn-group" role="group" style="width:100%">
            <button type="button" class="btn btn-outline-info" @click="endEditEvent()">
                Update
            </button>
            <button type="button" class="btn btn-outline-info" @click="cancelEvent()">
                Cancel
            </button>
            <button type="button" class="btn btn-outline-danger" @click="deleteEvent()">
                Delete
            </button>
        </div>
        <button v-else class="btn btn-outline-secondary ml-1" style="width:98%" @click="addEvent()">
            Add
        </button>
        <div id="semester" class="btn bg-info nav-btn mt-3">
            <div>Event List</div>
        </div>

        <table style="font-size:14px" class="table table-hover w-100">
            <thead>
                <th style="width:100%">
                    Number of events:
                    {{ schedule.currentSchedule.events.length }}
                </th>
                <th></th>
            </thead>
            <tbody>
                <tr
                    v-for="event in schedule.currentSchedule.events"
                    :key="event.key"
                    :class="{ 'table-primary': event === currentSelectedEvent }"
                    @click="editEvent(event)"
                >
                    <td>{{ event.title }}</td>
                    <td>
                        <i
                            :class="
                                event === currentSelectedEvent
                                    ? 'far fa-check-square'
                                    : 'far fa-square'
                            "
                            style="font-size: 20px"
                        ></i>
                    </td>
                </tr>
            </tbody>
        </table>
    </nav>
</template>

<script lang="ts" src="./EventView.ts"></script>
