/**
 * the component for adding and editing events
 * @author Kaiying Shan, Hanzhi Zhou
 */

/**
 *
 */
import { Component, Mixins } from 'vue-property-decorator';
import App from '../App';
import Event from '../models/Event';
import Meta from '../models/Meta';
import Store from '../store';
import { to12hr, to24hr } from '../utils';

@Component
export default class EventView extends Mixins(Store) {
    get event() {
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
    days = Meta.days;
    toBeModifiedDays = '';
    $parent!: App;

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
