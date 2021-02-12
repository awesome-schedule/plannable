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
 * @author Kaiying Shan
 * @param time
 * @returns null when fail to parse
 *
 * Example:
 * ```js
 * expect(parseTimeAsTimeArray('MoWeFr 10:00AM - 11:00AM')).toEqual(
 *  [ 7, 9, 9, 11, 11, 13, 13, 600, 660, 600, 660, 600, 660 ]);
 * ```
 */
export function parseTimeAsTimeArray(time: string): TimeArray | null {
    const [days, start, , end] = time.split(' ');
    if (days && start && end) {
        const s = hr12toInt(start);
        const e = hr12toInt(end);
        let lIdx = 0; // last day index
        const len = days.length;
        const arr = new Int16Array(8 + len);
        for (let i = 0; i < len; i += 2) {
            const idx = dayToInt[days.substr(i, 2) as Day];
            // fill the index for previous days
            for (let j = lIdx; j <= idx; j++) {
                arr[j] = 8 + i;
            }
            // place start and end
            arr[8 + i] = s;
            arr[8 + i + 1] = e;
            lIdx = idx + 1;
        }
        // fill the index for succeeding days
        for (let i = lIdx; i < 8; i++) arr[i] = len + 8;
        return arr;
    }
    return null;
}

/**
 * return true if two [[TimeArray]] objects have overlapping time blocks, false otherwise
 * @author Hanzhi Zhou, (amended by) Kaiying Shan
 * @param timeArray1
 * @param timeArray2
 * @param step1 the increment step for array 1
 * @param step2 the increment step for array 2
 * @note use step=2 for time only array, use step=3 for time-room combined array
 */
export function checkTimeConflict(
    timeArray1: TimeArray,
    timeArray2: TimeArray,
    step1 = 2,
    step2 = 2
) {
    for (let i = 0; i < 7; i++) {
        const s2 = timeArray2[i],
            e2 = timeArray2[i + 1];
        // skip the entire inner loop if needed
        if (s2 === e2) continue;

        const e1 = timeArray1[i + 1];
        for (let j = timeArray1[i]; j < e1; j += step1) {
            const begin1 = timeArray1[j];
            const end1 = timeArray1[j + 1];
            for (let k = s2; k < e2; k += step2) {
                if (calcOverlap(begin1, end1, timeArray2[k], timeArray2[k + 1]) > 0) {
                    return true;
                }
            }
        }
    }
    return false;
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
