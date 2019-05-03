/**
 * utilities to convert a schedule to a corresponding iCalendar file
 *
 * @author Kaiying Shan
 */

/**
 *
 */
import Schedule from '../models/Schedule';
import Meta from '../models/Meta';
import Section from '../models/Section';
import Event from '../models/Event';
import * as Utils from '.';

/**
 * Convert a schedule to iCalendar format.
 * @param schedule Schedule object to be parsed into iCalendar format.
 * @return parsed iCalendar file in a string.
 */
export function toICal(schedule: Schedule) {
    let ical = 'BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:UVa-Awesome-Schedule\n';

    let startWeekDay: number = 0;
    let startDate: Date = new Date(2019, 7, 27, 0, 0, 0),
        endDate: Date = new Date(2019, 11, 6, 0, 0, 0);

    for (const day of Meta.days) {
        for (const sb of schedule.days[day]) {
            if (sb.section instanceof Section) {
                for (const m of sb.section.meetings) {
                    if (m.dates === 'TBD' || m.dates === 'TBA') continue;
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
        for (const sb of schedule.days[Meta.days[d]]) {
            if (sb.section instanceof Section || sb.section instanceof Array) {
                let section = sb.section;
                if (sb.section instanceof Array) {
                    section = (section as Section[])[0];
                }
                for (const m of (section as Section).meetings) {
                    if (m.days === 'TBD' || m.days === 'TBA') continue;
                    if (m.days.indexOf(Meta.days[d]) === -1) continue;
                    const dayoffset: number = ((d + 7 - startWeekDay) % 7) + 1;
                    const [, start, , end] = m.days.split(' ');
                    const [startMin, endMin] = Utils.parseTimeAsInt(start, end);

                    const startTime = new Date(
                        startDate.getTime() + dayoffset * 24 * 60 * 60 * 1000 + startMin * 60 * 1000
                    );
                    ical += 'BEGIN:VEVENT\n';
                    ical += 'UID:\n';
                    ical += 'DTSTAMP:' + dateToICalString(startTime) + '\n';
                    ical += 'DTSTART:' + dateToICalString(startTime) + '\n';
                    ical +=
                        'RRULE:FREQ=WEEKLY;INTERVAL=1;BYDAY=' +
                        Meta.days[d].toUpperCase() +
                        ';BYHOUR=' +
                        startTime.getHours() +
                        ';BYMINUTE=' +
                        startTime.getMinutes() +
                        ';UNTIL=' +
                        dateToICalString(endDate) +
                        '\n';
                    ical +=
                        'DURATION=P' +
                        Math.floor((endMin - startMin) / 60) +
                        'H' +
                        ((endMin - startMin) % 60) +
                        'M' +
                        '\n';
                    ical += 'SUMMARY:' + m.section.department + ' ' + m.section.number + '\n';
                    ical += 'DESCRIPTION:' + m.section.title + '\n';
                    ical += 'LOCATION:' + m.room + '\n';
                    ical += 'END:VEVENT\n';
                }
            } else if (sb.section instanceof Event) {
                const dayoffset: number = ((d + 7 - startWeekDay) % 7) + 1;

                const [, start, , end] = sb.section.days.split(' ');
                const [startMin, endMin] = Utils.parseTimeAsInt(start, end);

                const startTime = new Date(
                    startDate.getTime() + dayoffset * 24 * 60 * 60 * 1000 + startMin * 60 * 1000
                );
                ical += 'BEGIN:VEVENT\n';
                ical += 'UID:\n';
                ical += 'DTSTAMP:' + dateToICalString(startTime) + '\n';
                ical += 'DTSTART:' + dateToICalString(startTime) + '\n';
                ical +=
                    'RRULE:FREQ=WEEKLY;INTERVAL=1;BYDAY=' +
                    Meta.days[d].toUpperCase() +
                    ';BYHOUR=' +
                    startTime.getHours() +
                    ';BYMINUTE=' +
                    startTime.getMinutes() +
                    ';UNTIL=' +
                    dateToICalString(endDate) +
                    '\n';
                ical +=
                    'DURATION=P' +
                    Math.floor((endMin - startMin) / 60) +
                    'H' +
                    ((endMin - startMin) % 60) +
                    'M' +
                    '\n';
                ical += 'SUMMARY:' + sb.section.title + '\n';
                ical += 'DESCRIPTION:' + sb.section.description + '\n';
                ical += 'LOCATION:' + sb.section.room + '\n';
                ical += 'END:VEVENT\n';
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
