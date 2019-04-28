<template>
    <nav class="d-block bg-light sidebar" style="scrollbar-width:thin !important">
        <div id="semester" class="btn bg-info nav-btn mt-0" style="color:white">
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

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator';
import App from '../App.vue';
import Schedule from '../models/Schedule';
import Meta from '../models/Meta';
import Event from '../models/Event';
import { to12hr, to24hr } from '../models/Utils';

@Component
export default class EventView extends Vue {
    @Prop(Schedule) readonly schedule!: Schedule;
    @Prop(Event) readonly event!: Event;

    // event related fields
    eventWeek = [false, false, false, false, false];
    eventTimeFrom = '';
    eventTimeTo = '';
    eventTitle? = '';
    eventRoom? = '';
    eventDescription? = '';
    isEditingEvent = false;
    days = Meta.days;
    toBeModifiedDays = '';

    mounted() {
        this.$watch(
            'event',
            () => {
                if (this.event) this.editEvent(this.event);
            },
            {
                immediate: true
            }
        );
    }
    updateDay(idx: number) {
        this.$set(this.eventWeek, idx, !this.eventWeek[idx]);
    }
    getEventDays() {
        let days = this.eventWeek.reduce((acc, x, i) => acc + (x ? Meta.days[i] : ''), '');
        days += ` ${to12hr(this.eventTimeFrom)} - ${to12hr(this.eventTimeTo)}`;
        return days;
    }
    addEvent() {
        const $parent = this.$parent as any;
        try {
            const days = this.getEventDays();

            if (days.startsWith(' ')) {
                $parent.noti.error('Please select at least one day');
                return;
            } else if (days.indexOf('NaN') !== -1) {
                $parent.noti.error('Please check your start/end time');
                return;
            }

            this.schedule.addEvent(
                days,
                true,
                this.eventTitle,
                this.eventRoom,
                this.eventDescription ? this.eventDescription.split('\n').join('<br />') : ''
            );
            // note: we don't need to regenerate schedules if the days property is not changed
            this.cancelEvent(this.toBeModifiedDays !== days);
        } catch (err) {
            $parent.noti.error(err.message);
        }
    }
    editEvent(event: Event) {
        this.isEditingEvent = true;
        this.eventTitle = event.title;
        this.eventRoom = event.room;
        this.eventDescription = event.description
            ? event.description.split('<br />').join('\n')
            : '';
        const [week, start, , end] = event.days.split(' ');
        for (let i = 0; i < Meta.days.length; i++) {
            if (week.indexOf(Meta.days[i]) !== -1) {
                this.$set(this.eventWeek, i, true);
            } else {
                this.$set(this.eventWeek, i, false);
            }
        }
        this.eventTimeFrom = to24hr(start);
        this.eventTimeTo = to24hr(end);
        this.toBeModifiedDays = event.days;
    }
    endEditEvent() {
        this.schedule.deleteEvent(this.toBeModifiedDays);
        this.addEvent();
    }
    deleteEvent() {
        this.schedule.deleteEvent(this.toBeModifiedDays);
        this.isEditingEvent = false;
        this.cancelEvent(true);
    }
    /**
     * this method is called after deleteEvent, endEditEvent and addEvent
     *
     * clear all properties and force recomputation of current schedule
     *
     * @param regenerate re-run algorithm if true
     */
    cancelEvent(regenerate = false) {
        const $parent = this.$parent as any;
        this.eventTitle = '';
        this.eventRoom = '';
        this.eventWeek.forEach((x, i, arr) => this.$set(arr, i, false));
        this.eventTimeFrom = '';
        this.eventTimeTo = '';
        this.eventDescription = '';
        this.isEditingEvent = false;
        $parent.eventToEdit = null;
        if (regenerate) $parent.generateSchedules();
        else $parent.currentSchedule.computeSchedule();
    }
}
</script>
