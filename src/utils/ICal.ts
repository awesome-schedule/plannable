/**
 * utilities for converting a schedule to a corresponding iCalendar file
 * @module src/utils
 * @todo need testing
 * @author Kaiying Shan
 */

/**
 *
 */
import Event from '@/models/Event';
import Meeting from '@/models/Meeting';
import Schedule from '@/models/Schedule';
import { Day, dayToInt } from '@/models/constants';
import { hr12toInt } from './time';

function dateToICalString(date: Date) {
    return (
        date.getUTCFullYear() +
        (date.getUTCMonth() + 1).toString().padStart(2, '0') +
        date
            .getUTCDate()
            .toString()
            .padStart(2, '0') +
        'T' +
        date
            .getUTCHours()
            .toString()
            .padStart(2, '0') +
        date
            .getUTCMinutes()
            .toString()
            .padStart(2, '0') +
        date
            .getUTCSeconds()
            .toString()
            .padStart(2, '0')
    );
}

function calcStartDate(prevStart: Date, day: Day) {
    const dayOffset = (dayToInt[day] + 7 - prevStart.getDay()) % 7;
    return new Date(prevStart.getTime() + dayOffset * 1000 * 60 * 60 * 24);
}

function toICalEventString(
    event: Event | Meeting,
    uid: string,
    startDate: Date,
    until: Date,
    summary: string,
    description: string,
    location: string
) {
    const [day, s, , e] = event.days.split(' ');
    const startMin = hr12toInt(s);
    const endMin = hr12toInt(e);

    const days: Day[] = [];
    for (let i = 0; i < day.length; i += 2) {
        days.push(day.substr(i, 2) as Day);
    }
    startDate = calcStartDate(startDate, days[0]);

    console.log(startMin, endMin);

    // const timeZone = ';TZID=America/New_York';
    const timeZone = '';
    let ical = 'BEGIN:VEVENT\r\n';
    ical += `UID:${uid}\r\n`;
    ical += `DTSTAMP${timeZone}:${dateToICalString(new Date())}\r\n`;
    ical += `DTSTART${timeZone}:${dateToICalString(
        new Date(startDate.getTime() + startMin * 60 * 1000)
    )}\r\n`;
    ical += `DTEND${timeZone}:${dateToICalString(
        new Date(startDate.getTime() + endMin * 60 * 1000)
    )}\r\n`;
    ical += `SUMMARY:${summary}\r\n`;
    ical += `RRULE:FREQ=WEEKLY;INTERVAL=1;BYDAY=${days
        .join(',')
        .toUpperCase()};UNTIL=${dateToICalString(until)}\r\n`;
    ical += `DURATION=${endMin - startMin}\r\n`;
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
    let ical = 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:plannable\r\n';
    // ical += 'BEGIN:VTIMEZONE\r\nTZID:America/New_York\r\nBEGIN:STANDARD\r\n';
    // ical += 'END:STANDARD\r\nEND:VTIMEZONE\r\n';
    let startDate: Date, endDate: Date;
    for (const { dateArray } of window.catalog.sections) {
        if (dateArray) {
            startDate = new Date(dateArray[0]);
            endDate = new Date(dateArray[1] + 1000 * 60 * 60 * 24);
            break;
        }
    }

    for (const [id] of schedule.current.ids) {
        const parsed = parseInt(id);
        if (isNaN(parsed)) continue;

        const sec = window.catalog.getSectionById(parsed);
        if (!sec.dateArray) continue;
        startDate = new Date(sec.dateArray[0]);
        endDate = new Date(sec.dateArray[1] + 1000 * 60 * 60 * 24);

        for (const meeting of sec.meetings) {
            try {
                ical += toICalEventString(
                    meeting,
                    `class-number-${id}`,
                    startDate,
                    endDate,
                    sec.displayName,
                    sec.title,
                    meeting.room
                );
            } catch (e) {
                // error parsing time. probably TBA/TBD/Web based
                console.warn(e);
            }
        }
    }

    for (const event of schedule.events) {
        ical += toICalEventString(
            event,
            `event-${event.key}`,
            startDate!,
            endDate!,
            event.title ?? 'no title',
            event.description ?? 'no description',
            event.room ?? 'no room'
        );
    }
    ical += 'END:VCALENDAR';
    console.log(ical);
    return ical;
}
