/**
 * utilities for converting a schedule to a corresponding iCalendar file
 * @module utils
 * @todo need testing
 * @author Kaiying Shan
 */

/**
 *
 */
import Schedule from '../models/Schedule';
import { hr12toInt } from './time';

function toICalEventString(
    uid: string,
    startDate: string,
    summary: string,
    day: string,
    hour: string,
    min: string,
    until: string,
    duration: string,
    description: string,
    location: string
) {
    let ical = '';
    ical += 'BEGIN:VEVENT\r\n';
    ical += `UID:${uid}\r\n`;
    ical += `DTSTAMP:${startDate}\r\n`;
    ical += `DTSTART:${startDate}\r\n`;
    ical += `SUMMARY:${summary}\r\n`;
    ical += `RRULE:FREQ=WEEKLY;INTERVAL=1;BYDAY=${day};BYHOUR=${hour};BYMINUTE=${min};UNTIL=${until}\r\n`;
    ical += `DURATION=${duration}\r\n`;
    ical += `DESCRIPTION:${description}\r\n`;
    ical += `LOCATION:${location}\r\n`;
    ical += 'END:VEVENT\r\n';
    return ical;
}

/**
 * Convert a schedule to iCalendar format.
 * @see https://icalendar.org/
 * @param schedule Schedule object to be parsed into iCalendar format.
 * @return a string of iCalendar format
 */
export function toICal(schedule: Schedule) {
    let ical = 'BEGIN:VCALENDAR\r\nVERSION:7.1\r\nPRODID:UVa-Awesome-Schedule\r\n';

    let startDate = new Date(2019, 7, 27, 0, 0, 0),
        endDate = new Date(2019, 11, 6, 0, 0, 0);

    for (const [id] of schedule.current.ids) {
        const sec = window.catalog.getSectionById(parseInt(id));
        if (!sec.dateArray) continue;
        startDate = new Date(sec.dateArray[0]);
        endDate = new Date(sec.dateArray[1] + 1000 * 60 * 60 * 24);

        for (const meeting of sec.meetings) {
            const [day, s, , e] = meeting.days.split(' ');
            const totalMin = hr12toInt(s);
            const duration = hr12toInt(e) - totalMin;
            const hour = Math.floor(totalMin / 60);
            const min = totalMin % 60;

            const days = [];
            for (let i = 0; i < day.length; i += 2) {
                days.push(day.substr(i, 2).toUpperCase());
            }
            const icalDay = days.join(',');

            ical += toICalEventString(
                `class-number-${id}`,
                dateToICalString(startDate),
                sec.displayName,
                icalDay,
                hour.toString(),
                min.toString(),
                dateToICalString(endDate),
                `${Math.floor(duration / 60)}H${duration % 60}M`,
                sec.title,
                meeting.room
            );
        }
    }

    for (const event of schedule.events) {
        const [day, s, , e] = event.days.split(' ');
        const startTime = hr12toInt(s);
        const duration = hr12toInt(e) - startTime;
        const days = [];
        for (let i = 0; i < day.length; i += 2) {
            days.push(day.substr(i, 2).toUpperCase());
        }
        const dayStr = days.join(',');
        ical += toICalEventString(
            `event-${event.title}`,
            dateToICalString(startDate),
            event.title ?? 'no title',
            dayStr,
            Math.floor(startTime / 60).toString(),
            (startTime % 60).toString(),
            dateToICalString(endDate),
            `${Math.floor(duration / 60)}H${duration % 60}M`,
            event.description ?? 'no description',
            event.room ?? 'no room'
        );
    }
    ical += 'END:VCALENDAR';
    return ical;
}

function dateToICalString(date: Date) {
    return (
        date.getFullYear() +
        (date.getMonth() + 1).toString().padStart(2, '0') +
        date
            .getDate()
            .toString()
            .padStart(2, '0') +
        'T' +
        date
            .getHours()
            .toString()
            .padStart(2, '0') +
        date
            .getMinutes()
            .toString()
            .padStart(2, '0') +
        '00'
    );
}
