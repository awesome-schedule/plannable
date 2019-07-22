/**
 * Utilities for parsing and convert in-between different time representations
 * @module utils
 */

/**
 *
 */
import { TimeArray, TimeBlock } from '../algorithm';
import { Day, dayToInt } from '@/models/Meta';
/**
 * @author Hanzhi Zhou
 * @param time
 * @returns null when fail to parse
 *
 * Example usage and return value:
 * ```js
 * parseTimeAll('MoWeFr 10:00AM - 11:00AM') => [['Mo', 'We', 'Fr'], [10*60, 11*60]]
 * ```
 */
export function parseTimeAll(time: string): [Day[], TimeBlock] | null {
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
 * @author Kaiying Cat
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
        let lIdx = 0;
        const arr: number[] = [1, 1, 1, 1, 1, 1, 1, 1];
        for (let i = 0; i < days.length; i += 2) {
            const idx = dayToInt[days.substr(i, 2) as Day];
            for (let j = lIdx; j <= idx; j++) {
                arr[j] = arr.length;
            }
            arr.push(s, e);
            lIdx = idx + 1;
        }
        for (let i = lIdx; i < 8; i++) {
            arr[i] = arr.length;
        }
        return arr;
    }
    return null;
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
 * return true of two [[TimeArray]] objects have overlapping time blocks, false otherwise
 * @author Hanzhi Zhou, (amended by) Kaiying Cat
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
        const s2 = timeArray2[i];
        const e2 = timeArray2[i + 1];
        // skip the entire loop if needed
        if (s2 === e2) continue;

        const s1 = timeArray1[i];
        const e1 = timeArray1[i + 1];
        for (let j = s1; j < e1; j += step1) {
            const begin1 = timeArray1[j] + 1;
            const end1 = timeArray1[j + 1] - 1;
            for (let k = s2; k < e2; k += step2) {
                const begin2 = timeArray2[k];
                const end2 = timeArray2[k + 1];
                if (
                    (begin1 <= begin2 && begin2 <= end1) ||
                    (begin1 <= end2 && end2 <= end1) ||
                    (begin1 >= begin2 && end1 <= end2)
                ) {
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
    const [start, end] = date.split(' - ');
    if (!start || !end) return;
    // start month / start day / start year
    const [sm, sd, sy] = start.split('/');
    const startDate = new Date(+sy, +sm - 1, +sd);
    const [em, ed, ey] = end.split('/');
    const endDate = new Date(+ey, +em - 1, +ed);
    return [startDate.getTime(), endDate.getTime()];
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
    if (a <= c && d <= b) return d - c;
    else if (c <= a && b <= d) return b - a;
    else if (a <= c && c <= b) return b - c;
    else if (a <= d && d <= b) return d - a;
    else return -1;
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
    const len = time.length;
    const pre = time.substring(0, len - 2);
    const [hour, minute] = pre.split(':');
    const numHour = +hour;
    if (time.substring(len - 2) === 'AM') {
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
 * helper function used in
 * @see [[GridSchedule]]
 * @see [[CourseBlock]]
 * @author Kaiying Shan
 * @param time
 */
export function timeToNum(time: string) {
    const sep = time.split(':');
    const min = parseInt(sep[1]);
    const t = (parseInt(sep[0]) - 8) * 2;
    return min >= 30 ? t + 1 : t;
}
