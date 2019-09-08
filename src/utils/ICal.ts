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
import { DAYS } from '../models/Meta';
import Schedule from '../models/Schedule';
import Section from '../models/Section';

/**
 * Convert a schedule to iCalendar format.
 * @see https://icalendar.org/
 * @param schedule Schedule object to be parsed into iCalendar format.
 * @return a string of iCalendar format
 */
export function toICal(schedule: Schedule) {
    let ical = 'BEGIN:VCALENDAR\r\nVERSION:7.1\r\nPRODID:UVa-Awesome-Schedule\r\n';

    let startWeekDay = 0;
    let startDate = new Date(2019, 7, 27, 0, 0, 0),
        endDate = new Date(2019, 11, 6, 0, 0, 0);

    for (const blocks of schedule.days) {
        for (const sb of blocks) {
            const { section } = sb;
            if (section instanceof Section) {
                const { dates } = section;
                if (!dates || dates === 'TBD' || dates === 'TBA') continue;
                const [sd, , ed] = dates.split(' ');
                const [sl, sm, sr] = sd.split('/');
                startDate = new Date(parseInt(sr), parseInt(sl) - 1, parseInt(sm), 0, 0, 0);
                const [el, em, er] = ed.split('/');
                endDate = new Date(parseInt(er), parseInt(el) - 1, parseInt(em), 0, 0, 0);
                startWeekDay = startDate.getDay();
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
                    if (m.days === 'TBD' || m.days === 'TBA' || m.days.indexOf(DAYS[d]) === -1)
                        continue;
                    const dayoffset = ((d + 7 - startWeekDay) % 7) + 1;
                    const [, start, , end] = m.days.split(' ');
                    const startMin = Utils.hr12toInt(start);
                    const duration = Utils.hr12toInt(end) - startMin;

                    const startTime = new Date(
                        startDate.getTime() + dayoffset * 24 * 60 * 60 * 1000 + startMin * 60 * 1000
                    );
                    ical += 'BEGIN:VEVENT\r\n';
                    ical += 'UID:\r\n';
                    ical += 'DTSTAMP:' + dateToICalString(startTime) + '\r\n';
                    ical += 'DTSTART:' + dateToICalString(startTime) + '\r\n';
                    ical +=
                        'RRULE:FREQ=WEEKLY;INTERVAL=1;BYDAY=' +
                        DAYS[d].toUpperCase() +
                        ';BYHOUR=' +
                        startTime.getHours() +
                        ';BYMINUTE=' +
                        startTime.getMinutes() +
                        ';UNTIL=' +
                        dateToICalString(endDate) +
                        '\r\n';
                    ical +=
                        'DURATION=P' +
                        Math.floor(duration / 60) +
                        'H' +
                        (duration % 60) +
                        'M' +
                        '\r\n';
                    ical += 'SUMMARY:' + section.department + ' ' + section.number + '\r\n';
                    ical += 'DESCRIPTION:' + section.title + '\r\n';
                    ical += 'LOCATION:' + m.room + '\r\n';
                    ical += 'COLOR:' + sb.backgroundColor + '\r\n';
                    ical += 'END:VEVENT\r\n';
                }
            } else if (sb.section instanceof Event) {
                const dayoffset = ((d + 7 - startWeekDay) % 7) + 1;

                const [, start, , end] = sb.section.days.split(' ');
                const startMin = Utils.hr12toInt(start);
                const duration = Utils.hr12toInt(end) - startMin;

                const startTime = new Date(
                    startDate.getTime() + dayoffset * 24 * 60 * 60 * 1000 + startMin * 60 * 1000
                );
                ical += 'BEGIN:VEVENT\r\n';
                ical += 'UID:\r\n';
                ical += 'DTSTAMP:' + dateToICalString(startTime) + '\r\n';
                ical += 'DTSTART:' + dateToICalString(startTime) + '\r\n';
                ical +=
                    'RRULE:FREQ=WEEKLY;INTERVAL=1;BYDAY=' +
                    DAYS[d].toUpperCase() +
                    ';BYHOUR=' +
                    startTime.getHours() +
                    ';BYMINUTE=' +
                    startTime.getMinutes() +
                    ';UNTIL=' +
                    dateToICalString(endDate) +
                    '\r\n';
                ical +=
                    'DURATION=P' + Math.floor(duration / 60) + 'H' + (duration % 60) + 'M' + '\r\n';
                if (sb.section.title) ical += 'SUMMARY:' + sb.section.title + '\r\n';
                if (sb.section.description)
                    ical += 'DESCRIPTION:' + sb.section.description + '\r\n';
                if (sb.section.room) ical += 'LOCATION:' + sb.section.room + '\r\n';
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
