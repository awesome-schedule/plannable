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
 * @author Hanzhi Zhou
 * @param time
 * @returns null when fail to parse
 *
 * Example:
 * ```js
 * expect(parseTimeAsTimeArray('MoWeFr 10:00AM - 11:00AM')).toEqual([
 *     [600, 660],
 *     [],
 *     [600, 660],
 *     [],
 *     [600, 660],
 * ])
 * ```
 */
export function parseTimeAsTimeArray(time: string): TimeArray | null {
    const [days, start, , end] = time.split(' ');
    if (days && start && end) {
        const timeDict: TimeArray = [[], [], [], [], []];
        const s = hr12toInt(start),
            e = hr12toInt(end);
        for (let i = 0; i < days.length; i += 2)
            timeDict[dayToInt[days.substr(i, 2) as Day]].push(s, e);
        return timeDict;
    }
    return null;
}

export function hr24toInt(time: string) {
    const sep = time.split(':');
    return +sep[0] * 60 + +sep[1];
}

export function hr12toInt(time: string) {
    return hr24toInt(to24hr(time));
}

/**
 * return true of two `TimeArray` objects have overlapping time blocks, false otherwise
 * @author Hanzhi Zhou
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
    for (let i = 0; i < 5; i++) {
        const timeBlocks1 = timeArray1[i];
        const len1 = timeBlocks1.length;
        if (!len1) continue;

        const timeBlocks2 = timeArray2[i];
        const len2 = timeBlocks2.length;
        if (!len2) continue;

        for (let j = 0; j < len1; j += step1) {
            const begin1 = timeBlocks1[j] + 1;
            const end1 = timeBlocks1[j + 1] - 1;
            for (let k = 0; k < len2; k += step2) {
                const begin2 = timeBlocks2[k];
                const end2 = timeBlocks2[k + 1];
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
