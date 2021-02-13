/* eslint-disable @typescript-eslint/no-use-before-define */
/**
 * Utilities for parsing and convert in-between different time representations
 * @module src/utils
 */

/**
 *
 */
import { Day, dayToInt } from '@/models/constants';
import { TimeArray } from '../algorithm/ScheduleGenerator';

/**
 * convert 24 hour format time to 12 hour format.
 * @author Kaiying Shan
 * @param time the time in 24 hour format
 *
 * Example usage and return value:
 * ```js
 * to12hr('17:00') => '5:00PM'
 * ```
 */
export function to12hr(time: string) {
    const sep = time.split(':');
    const hr = +sep[0];
    if (hr === 12) {
        return time + 'PM';
    } else if (hr === 0) {
        return `12:${sep[1]}AM`;
    } else if (hr < 12) {
        return time + 'AM';
    } else {
        return `${hr - 12}:${sep[1]}PM`;
    }
}

/**
 * convert 12 hr to 24 hr
 * @author Hanzhi Zhou
 * @param time
 * Example usage and return value:
 * ```js
 * to12hr('5:00PM') => '17:00'
 * ```
 */
export function to24hr(time: string) {
    const pre = time.substring(0, time.length - 2);
    const [hour, minute] = pre.split(':');

    const numHour = +hour;
    const suffix = time.substring(time.length - 2);
    if (suffix === 'AM' || suffix == 'am') {
        if (numHour === 12) {
            return '00:' + minute;
        } else {
            return pre;
        }
    } else {
        if (numHour === 12) {
            return pre;
        } else {
            return `${(numHour + 12).toString().padStart(2, '0')}:${minute}`;
        }
    }
}

/**
 * convert `13:00` style time to minutes starting from `00:00`
 * @param time
 */
export function hr24toInt(time: string) {
    const sep = time.split(':');
    return +sep[0] * 60 + +sep[1];
}

/**
 * convert `1:00AM` style time to minutes starting from `00:00`
 * @param time
 */
export function hr12toInt(time: string) {
    return hr24toInt(to24hr(time));
}

/**
 * @author Hanzhi Zhou
 * @param time
 * @returns null when fail to parse
 *
 * Example usage and return value:
 * ```js
 * parseTimeAll('MoWeFr 10:00AM - 11:00AM') => [['Mo', 'We', 'Fr'], [600, 660]]
 * ```
 */
export function parseTimeAll(time: string): [Day[], [number, number]] | null {
    const [days, start, , end] = time.split(' ');
    if (days && start && end) {
        const dayList: Day[] = [];
        for (let i = 0; i < days.length; i += 2) {
            dayList.push(days.substr(i, 2) as Day);
        }
        return [dayList, [hr12toInt(start), hr12toInt(end)]];
    }
    return null;
}

/**
 * parse `08/27/2019 - 12/17/2019` style dates to a tuple of numbers
 * @param date
 */
export function parseDate(date: string): [number, number] | undefined {
    if (typeof date !== 'string') return;
    const [start, end] = date.split(' - ');
    if (!start || !end) return;
    // start month / start day / start year
    const [sm, sd, sy] = start.split('/');
    const startDate = Date.UTC(+sy, +sm - 1, +sd);
    const [em, ed, ey] = end.split('/');
    const endDate = Date.UTC(+ey, +em - 1, +ed);
    return [startDate, endDate];
}

/**
 * calculate the overlap between time block [a, b] and [c, d].
 * @author Hanzhi Zhou
 * @returns
 *  - 0 if only end points touch
 *  - -1 if no overlap
 *  - the area of overlapping region if overlap
 */
export function calcOverlap(a: number, b: number, c: number, d: number) {
    if (c > b || a > d) return -1;
    return Math.min(b, d) - Math.max(a, c);
}

/**
 * return the union of the blocks [a, b] and [c, d]
 * @author Hanzhi Zhou
 */
export function blockUnion(
    a: number,
    b: number,
    c: number,
    d: number
): [number, number] | undefined {
    if (a <= c && d <= b) return [a, b];
    else if (c <= a && b <= d) return [c, d];
    else if (a <= c && c <= b) return [a, d];
    else if (a <= d && d <= b) return [c, b];
    return;
}

export function intTo24hr(num: number) {
    return `${Math.floor(num / 60)
        .toString()
        .padStart(2, '0')}:${(num % 60).toString().padStart(2, '0')}`;
}
