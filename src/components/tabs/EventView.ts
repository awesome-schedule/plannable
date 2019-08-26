/**
 * @module components/tabs
 */

/**
 *
 */
import Event from '@/models/Event';
import { DAYS } from '@/models/Meta';
import Store from '@/store';
import { hr24toInt, to12hr, to24hr } from '@/utils';
import { Component, Watch } from 'vue-property-decorator';

/**
 * the component for adding and editing events
 * @author Kaiying Shan, Hanzhi Zhou, Zichao Hu
 * @noInheritDoc
 */
@Component
export default class EventView extends Store {
    // event related fields
    eventWeek = [false, false, false, false, false, false, false];
    eventTimeFrom = '';
    eventTimeTo = '';
    eventTitle? = '';
    eventRoom? = '';
    eventDescription? = '';

    toBeModifiedDays = '';

    get days() {
        return DAYS;
    }

    @Watch('status.eventToEdit', { immediate: true })
    eventWatch() {
        const { eventToEdit } = this.status;
        if (eventToEdit) this.editEvent(eventToEdit);
    }
    // need to remove eventToEdit before switching other tabs
    beforeDestroy() {
        this.status.eventToEdit = null;
    }
    updateDay(idx: number) {
        this.$set(this.eventWeek, idx, !this.eventWeek[idx]);
    }
    /**
     * validate the days, start time and end time of this event, and then parse them
     * to desired format. emit notification on error.
     */
    getEventDays() {
        let days = this.eventWeek.reduce((acc, x, i) => acc + (x ? this.days[i] : ''), '');

        if (!days) {
            this.noti.error('Event: Please select at least one day');
            return;
        }
        if (!this.eventTimeFrom || !this.eventTimeTo) {
            this.noti.error('Event: Please check your start/end time');
            return;
        }
        const start = hr24toInt(this.eventTimeFrom),
            end = hr24toInt(this.eventTimeTo);
        if (start >= end) {
            this.noti.error('Event: Start time must be earlier than end time');
            return;
        }
        days += ` ${to12hr(this.eventTimeFrom)} - ${to12hr(this.eventTimeTo)}`;
        return days;
    }
    copyEvent(ev: Event) {
        this.status.eventToEdit = null;
        this.editEvent(ev);
        this.eventTitle += '-copy';
    }
    addEvent() {
        // fold sidebar on mobile
        this.status.foldView();
        try {
            const days = this.getEventDays();
            if (!days) return;

            this.schedule.proposedSchedule.addEvent(
                days,
                true,
                this.eventTitle,
                this.eventRoom,
                this.eventDescription ? this.eventDescription.split('\n').join('<br />') : ''
            );
            // note: we don't need to regenerate schedules if the days property is not changed
            this.cleanup(this.toBeModifiedDays !== days && this.schedule.generated);
        } catch (err) {
            this.noti.error(err.message);
        }
    }
    /**
     * bind the properties of this event to input fields
     * @param event
     */
    editEvent(event: Event) {
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
    /**
     * apply the edit
     */
    endEditEvent() {
        this.schedule.proposedSchedule.deleteEvent(this.toBeModifiedDays);
        this.addEvent();
    }
    deleteEvent() {
        this.schedule.proposedSchedule.deleteEvent(this.toBeModifiedDays);
        this.cleanup(this.schedule.generated);
    }
    /**
     * Clear all properties of this component and force re-computation of the current schedule,
     * called after deleteEvent, endEditEvent and addEvent.
     * @param regenerate re-run algorithm if true
     */
    cleanup(regenerate = false) {
        // fold sidebar on mobile
        this.status.foldView();

        this.eventRoom = this.eventTimeFrom = this.eventTimeTo = this.eventDescription = this.eventTitle =
            '';
        this.eventWeek.forEach((x, i, arr) => this.$set(arr, i, false));
        this.status.eventToEdit = null;
        if (regenerate) this.generateSchedules();
        else this.schedule.currentSchedule.computeSchedule();
        this.saveStatus();
    }
}
