/**
 * Utilities for parsing and convert in-between different time representations
 */

/**
 *
 */
import { TimeDict, TimeBlock } from '../algorithm/ScheduleGenerator';
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
export function parseTimeAll(time: string): [string[], TimeBlock] | null {
    const [days, start, , end] = time.split(' ');
    if (days && start && end) {
        const dayList = [];
        for (let i = 0; i < days.length; i += 2) {
            dayList.push(days.substr(i, 2));
        }
        return [dayList, parseTimeAsInt(start, end)];
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
 * expect(parseTimeAll('MoWeFr 10:00AM - 11:00AM')).toEqual({
 *     Mo: [600, 660],
 *     We: [600, 660],
 *     Fr: [600, 660],
 * })
 * ```
 */
export function parseTimeAllAsDict(time: string): TimeDict | null {
    const [days, start, , end] = time.split(' ');
    if (days && start && end) {
        const timeDict: TimeDict = {};
        const block = parseTimeAsInt(start, end);
        for (let i = 0; i < days.length; i += 2) {
            timeDict[days.substr(i, 2)] = block;
        }
        return timeDict;
    }
    return null;
}

/**
 * Parse time in 12h format to number of minutes from 0:00,
 * assuming that the start time is **always smaller (earlier)** than end time
 *
 * @author Hanzhi Zhou
 * @param start start time such as `10:00AM`
 * @param end  end time such as `11:00AM`
 *
 * Example usage:
 * ```js
 * parseTimeAsInt('10:00AM', '11:00AM') => [600, 660]
 * ```
 */
export function parseTimeAsInt(start: string, end: string): TimeBlock {
    let suffix = start.substr(start.length - 2, 2);
    let start_time: number;
    let end_time: number;
    let hour: string, minute: string;
    if (suffix === 'PM') {
        [hour, minute] = start.substring(0, start.length - 2).split(':');
        start_time = ((+hour % 12) + 12) * 60 + +minute;

        [hour, minute] = end.substring(0, end.length - 2).split(':');
        end_time = ((+hour % 12) + 12) * 60 + +minute;
    } else {
        const t1 = start.substring(0, start.length - 2).split(':');
        start_time = (+t1[0] % 12) * 60 + +t1[1];
        suffix = end.substr(end.length - 2, 2);
        [hour, minute] = end.substring(0, end.length - 2).split(':');
        if (suffix === 'PM') {
            end_time = ((+hour % 12) + 12) * 60 + +minute;
        } else {
            end_time = (+hour % 12) * 60 + +minute;
        }
    }
    return [start_time, end_time];
}

/**
 * return true of two `TimeDict` objects have overlapping time blocks, false otherwise
 *
 * @author Zichao Hu, Hanzhi Zhou
 * @param timeDict1
 * @param timeDict2
 */
export function checkTimeConflict(timeDict1: TimeDict, timeDict2: TimeDict) {
    for (const dayBlock in timeDict1) {
        const timeBlocks2 = timeDict2[dayBlock];
        if (!timeBlocks2) {
            continue;
        }
        // if the key exists, it cannot be undefined.
        const timeBlocks1 = timeDict1[dayBlock] as number[];

        for (let i = 0; i < timeBlocks1.length; i += 2) {
            const begin = timeBlocks1[i] + 1;
            const end = timeBlocks1[i + 1] - 1;
            for (let j = 0; j < timeBlocks2.length; j += 2) {
                const beginTime = timeBlocks2[j];
                const endTime = timeBlocks2[j + 1];
                if (
                    (begin <= beginTime && beginTime <= end) ||
                    (begin <= endTime && endTime <= end) ||
                    (begin >= beginTime && end <= endTime)
                ) {
                    return true;
                }
            }
        }
    }
    return false;
}

/**
 * @author Hanzhi Zhou
 * @param start1
 * @param end1
 * @param start2
 * @param end2
 * @param includeEnd whether return `true` (conflict) if only the end points touch each other
 */
export function checkTimeBlockConflict(
    start1: number,
    end1: number,
    start2: number,
    end2: number,
    includeEnd: boolean = true
) {
    if (includeEnd) {
        return (
            (start1 <= start2 && start2 <= end1) ||
            (start1 <= end2 && end2 <= end1) ||
            (start1 >= start2 && end1 <= end2)
        );
    } else {
        return !!calcOverlap(start1, end1, start2, end2);
    }
}

/**
 * calculate the overlap between time block [a, b] and [c, d].
 *
 * Return 0 when no overlap or zero overlap.
 *
 * @author Hanzhi Zhou
 *
 * @param a
 * @param b
 * @param c
 * @param d
 */
export function calcOverlap(a: number, b: number, c: number, d: number) {
    if (a <= c && d <= b) return d - c;
    if (a <= c && c <= b) return b - c;
    else if (a <= d && d <= b) return d - a;
    else if (a >= c && b <= d) return b - a;
    else return 0;
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
    const hr = parseInt(sep[0]);
    if (hr === 12) {
        return time + 'PM';
    } else if (hr === 0) {
        return `12:${sep[1]}AM`;
    } else if (hr < 12) {
        return time + 'AM';
    } else {
        return hr - 12 + ':' + sep[1] + 'PM';
    }
}

/**
 * convert 12 hr to 24 hr
 * @author Kaiying Shan
 * @param time
 * Example usage and return value:
 * ```js
 * to12hr('5:00PM') => '17:00'
 * ```
 */
export function to24hr(time: string) {
    const [hour, minute] = time.substring(0, time.length - 2).split(':');
    const numHour = parseInt(hour);
    return (
        (time.substring(time.length - 2) === 'AM'
            ? numHour === 12
                ? '00'
                : hour
            : '' + (numHour === 12 ? 12 : numHour + 12)) +
        ':' +
        minute
    );
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
