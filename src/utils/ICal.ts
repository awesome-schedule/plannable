/**
 * utilities for converting a schedule to a corresponding iCalendar file
 * @module utils
 * @todo need testing
 * @author Kaiying Shan
 */

/**
 *
 */
import * as Utils from '.';
import Course from '../models/Course';
import Event from '../models/Event';
import Meta from '../models/Meta';
import Schedule from '../models/Schedule';
import Section from '../models/Section';

/**
 * Convert a schedule to iCalendar format.
 * @see https://icalendar.org/
 * @param schedule Schedule object to be parsed into iCalendar format.
 * @return a string of iCalendar format
 */
export function toICal(schedule: Schedule) {
    let ical = 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:UVa-Awesome-Schedule\r\n';

    let startWeekDay: number = 0;
    let startDate: Date = new Date(2019, 7, 27, 0, 0, 0),
        endDate: Date = new Date(2019, 11, 6, 0, 0, 0);

    for (const blocks of schedule.days) {
        for (const sb of blocks) {
            if (sb.section instanceof Section) {
                for (const m of sb.section.meetings) {
                    if (!m.dates || m.dates === 'TBD' || m.dates === 'TBA') continue;
                    const [sd, , ed] = m.dates.split(' ');
                    const [sl, sm, sr] = sd.split('/');
                    startDate = new Date(parseInt(sr), parseInt(sl) - 1, parseInt(sm), 0, 0, 0);
                    const [el, em, er] = ed.split('/');
                    endDate = new Date(parseInt(er), parseInt(el) - 1, parseInt(em), 0, 0, 0);
                    startWeekDay = startDate.getDay();
                    break;
                }
            }
        }
    }

    for (let d = 0; d < 5; d++) {
        for (const sb of schedule.days[d]) {
            if (sb.section instanceof Section || sb.section instanceof Course) {
                let section = sb.section;
                if (section instanceof Course) {
                    section = section.getFirstSection();
                }
                for (const m of section.meetings) {
                    if (m.days === 'TBD' || m.days === 'TBA') continue;
                    if (m.days.indexOf(Meta.days[d]) === -1) continue;
                    const dayoffset: number = ((d + 7 - startWeekDay) % 7) + 1;
                    const [, start, , end] = m.days.split(' ');
                    const [startMin, endMin] = Utils.parseTimeAsInt(start, end);

                    const startTime = new Date(
                        startDate.getTime() + dayoffset * 24 * 60 * 60 * 1000 + startMin * 60 * 1000
                    );
                    ical += 'BEGIN:VEVENT\r\n';
                    ical += 'UID:\r\n';
                    ical += 'DTSTAMP:' + dateToICalString(startTime) + '\r\n';
                    ical += 'DTSTART:' + dateToICalString(startTime) + '\r\n';
                    ical +=
                        'RRULE:FREQ=WEEKLY;INTERVAL=1;BYDAY=' +
                        Meta.days[d].toUpperCase() +
                        ';BYHOUR=' +
                        startTime.getHours() +
                        ';BYMINUTE=' +
                        startTime.getMinutes() +
                        ';UNTIL=' +
                        dateToICalString(endDate) +
                        '\r\n';
                    ical +=
                        'DURATION=P' +
                        Math.floor((endMin - startMin) / 60) +
                        'H' +
                        ((endMin - startMin) % 60) +
                        'M' +
                        '\r\n';
                    ical += 'SUMMARY:' + m.section.department + ' ' + m.section.number + '\r\n';
                    ical += 'DESCRIPTION:' + m.section.title + '\r\n';
                    ical += 'LOCATION:' + m.room + '\r\n';
                    ical += 'COLOR:' + sb.backgroundColor + '\r\n';
                    ical += 'END:VEVENT\r\n';
                }
            } else if (sb.section instanceof Event) {
                const dayoffset: number = ((d + 7 - startWeekDay) % 7) + 1;

                const [, start, , end] = sb.section.days.split(' ');
                const [startMin, endMin] = Utils.parseTimeAsInt(start, end);

                const startTime = new Date(
                    startDate.getTime() + dayoffset * 24 * 60 * 60 * 1000 + startMin * 60 * 1000
                );
                ical += 'BEGIN:VEVENT\r\n';
                ical += 'UID:\r\n';
                ical += 'DTSTAMP:' + dateToICalString(startTime) + '\r\n';
                ical += 'DTSTART:' + dateToICalString(startTime) + '\r\n';
                ical +=
                    'RRULE:FREQ=WEEKLY;INTERVAL=1;BYDAY=' +
                    Meta.days[d].toUpperCase() +
                    ';BYHOUR=' +
                    startTime.getHours() +
                    ';BYMINUTE=' +
                    startTime.getMinutes() +
                    ';UNTIL=' +
                    dateToICalString(endDate) +
                    '\r\n';
                ical +=
                    'DURATION=P' +
                    Math.floor((endMin - startMin) / 60) +
                    'H' +
                    ((endMin - startMin) % 60) +
                    'M' +
                    '\r\n';
                ical += 'SUMMARY:' + sb.section.title + '\r\n';
                ical += 'DESCRIPTION:' + sb.section.description + '\r\n';
                ical += 'LOCATION:' + sb.section.room + '\r\n';
                ical += 'COLOR:' + sb.backgroundColor + '\r\n';
                ical += 'END:VEVENT\r\n';
            }
        }
    }
    ical += 'END:VCALENDAR';
    return ical;
}

function dateToICalString(date: Date) {
    return (
        date.getFullYear().toString() +
        (date.getMonth() < 9 ? '0' + (date.getMonth() + 1) : (date.getMonth() + 1).toString()) +
        (date.getDate() < 10 ? '0' + date.getDate().toString() : date.getDate().toString()) +
        'T' +
        (date.getHours() < 10 ? '0' + date.getHours().toString() : date.getHours().toString()) +
        (date.getMinutes() < 10
            ? '0' + date.getMinutes().toString()
            : date.getMinutes().toString()) +
        '00'
    );
}
