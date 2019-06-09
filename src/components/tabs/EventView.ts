/**
 * @module components/tabs
 */
import { Component, Watch } from 'vue-property-decorator';
import Event from '@/models/Event';
import { DAYS } from '@/models/Meta';
import Store from '@/store';
import { to12hr, to24hr } from '@/utils';

/**
 * the component for adding and editing events
 * @author Kaiying Shan, Hanzhi Zhou, Zichao Hu
 */
@Component
export default class EventView extends Store {
    get event() {
        // reset event.selected to false if it is not editing
        if (!this.isEditingEvent) {
            for (const ev of this.schedule.currentSchedule.events) {
                ev.selected = false;
            }
        }
        return this.status.eventToEdit;
    }

    // event related fields
    eventWeek = [false, false, false, false, false];
    eventTimeFrom = '';
    eventTimeTo = '';
    eventTitle? = '';
    eventRoom? = '';
    eventDescription? = '';
    isEditingEvent = false;

    readonly days = DAYS;
    toBeModifiedDays = '';

    @Watch('event', { immediate: true })
    eventWatch() {
        if (this.event) this.editEvent(this.event);
    }
    // need to remove eventToEdit before switching other tabs
    beforeDestroy() {
        this.status.eventToEdit = null;
    }
    updateDay(idx: number) {
        this.$set(this.eventWeek, idx, !this.eventWeek[idx]);
    }
    getEventDays() {
        let days = this.eventWeek.reduce((acc, x, i) => acc + (x ? this.days[i] : ''), '');
        days += ` ${to12hr(this.eventTimeFrom)} - ${to12hr(this.eventTimeTo)}`;
        return days;
    }
    addEvent() {
        // fold sidebar on mobile
        this.status.foldView();
        try {
            const days = this.getEventDays();

            if (days.startsWith(' ')) {
                this.noti.error('Please select at least one day');
                return;
            } else if (days.indexOf('NaN') !== -1) {
                this.noti.error('Please check your start/end time');
                return;
            }

            this.schedule.proposedSchedule.addEvent(
                days,
                true,
                this.eventTitle,
                this.eventRoom,
                this.eventDescription ? this.eventDescription.split('\n').join('<br />') : ''
            );
            // note: we don't need to regenerate schedules if the days property is not changed
            this.cancelEvent(this.toBeModifiedDays !== days && this.schedule.generated);
        } catch (err) {
            this.noti.error(err.message);
        }
    }
    editEvent(event: Event) {
        // enable the editing event to be selected for rendering
        for (const ev of this.schedule.currentSchedule.events) {
            ev.selected = ev.hash() === event.hash() ? true : false;
        }

        this.isEditingEvent = true;
        this.eventTitle = event.title;
        this.eventRoom = event.room;
        this.eventDescription = event.description
            ? event.description.split('<br />').join('\n')
            : '';
        const [week, start, , end] = event.days.split(' ');
        for (let i = 0; i < this.days.length; i++) {
            if (week.indexOf(this.days[i]) !== -1) {
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
        this.schedule.proposedSchedule.deleteEvent(this.toBeModifiedDays);
        this.addEvent();
    }
    deleteEvent() {
        this.schedule.proposedSchedule.deleteEvent(this.toBeModifiedDays);
        this.isEditingEvent = false;
        this.cancelEvent(this.schedule.generated);
    }
    /**
     * this method is called after deleteEvent, endEditEvent and addEvent
     *
     * clear all properties of this component and force re-computation of the current schedule
     *
     * @param regenerate re-run algorithm if true
     */
    cancelEvent(regenerate = false) {
        // fold sidebar on mobile
        this.status.foldView();

        this.eventTitle = '';
        this.eventRoom = '';
        this.eventWeek.forEach((x, i, arr) => this.$set(arr, i, false));
        this.eventTimeFrom = '';
        this.eventTimeTo = '';
        this.eventDescription = '';
        this.isEditingEvent = false;
        this.status.eventToEdit = null;
        if (regenerate) this.generateSchedules();
        else this.schedule.currentSchedule.computeSchedule();
    }
}
