<template>
    <nav class="d-block bg-light sidebar" style="scrollbar-width:thin !important">
        <button id="semester" class="btn btn-info nav-btn mt-0" type="button">
            <div v-if="isEditingEvent">Edit Event</div>
            <div v-else>Add Event</div>
        </button>
        <div class="input-group my-3" style="width:98%;margin-left:1%">
            <div class="input-group-prepend">
                <span class="input-group-text">Title</span>
            </div>
            <input v-model="eventTitle" class="form-control" type="text" />
        </div>
        <div class="btn-group" role="group" style="width:98%;margin-left:1%">
            <button
                v-for="(day, idx) in days"
                :key="idx"
                :class="'btn btn-secondary' + (eventWeek[idx] ? ' active' : '')"
                type="button"
                @click="updateDay(idx)"
            >
                {{ day }}
            </button>
        </div>
        <br />
        <div class="input-group mt-3 ml-1" style="width:98%">
            <div class="input-group-prepend">
                <span class="input-group-text">From</span>
            </div>
            <input
                v-model="eventTimeFrom"
                class="form-control"
                type="time"
                style="-webkit-appearance:button"
            />
        </div>
        <div class="input-group mt-1 ml-1" style="width:98%">
            <div class="input-group-prepend">
                <span class="input-group-text">to</span>
            </div>
            <input
                v-model="eventTimeTo"
                class="form-control"
                type="time"
                style="-webkit-appearance:button"
            />
        </div>
        <div class="input-group flex-nowrap mt-3 ml-1" style="width:98%">
            <div class="input-group-prepend">
                <span class="input-group-text">Place (Optional)</span>
            </div>
            <input v-model="eventRoom" type="text" class="form-control" />
        </div>

        <textarea
            v-model="eventDescription"
            class="mt-3 ml-1"
            placeholder="Description"
            style="width:98%;height:100px;border-radius: 3px 3px 3px 3px"
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
import { to12hr } from '../models/Utils';

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
        let days = '';
        for (let i = 0; i < 5; i++) {
            if (this.eventWeek[i]) {
                days += Meta.days[i];
            }
        }
        days += ' ';
        days += to12hr(this.eventTimeFrom);
        days += ' - ';
        days += to12hr(this.eventTimeTo);
        return days;
    }
    addEvent() {
        const $parent = this.$parent as any;
        try {
            const days = this.getEventDays();

            if (days.indexOf('NaN') !== -1) {
                $parent.noti.error('Please enter a valid time!');
                return;
            }

            let invalid = true;

            for (const d of Meta.days) {
                if (days.indexOf(d) !== -1) {
                    invalid = false;
                    continue;
                }
            }

            if (invalid) {
                $parent.noti.error('Please enter a valid time!');
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
        const [starthr, startmin] = start.substring(0, start.length - 2).split(':');
        const start24 =
            (start.substring(start.length - 2, start.length) === 'AM'
                ? parseInt(starthr) === 12
                    ? '00'
                    : starthr
                : '' + (parseInt(starthr) === 12 ? 12 : parseInt(starthr) + 12)) +
            ':' +
            startmin;
        this.eventTimeFrom = start24;
        const [endhr, endmin] = end.substring(0, end.length - 2).split(':');
        const end24 =
            (end.substring(end.length - 2, end.length) === 'AM'
                ? parseInt(endhr) === 12
                    ? '00'
                    : endhr
                : '' + (parseInt(endhr) === 12 ? 12 : parseInt(endhr) + 12)) +
            ':' +
            endmin;
        this.eventTimeTo = end24;
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
        this.eventWeek.forEach((x, i) => this.$set(this.eventWeek, i, false));
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
