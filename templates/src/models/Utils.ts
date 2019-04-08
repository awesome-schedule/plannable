import { TimeDict } from '@/algorithm/ScheduleGenerator';

/**
 *
 * Parse `MoWeFr 10:00AM - 11:00AM` to `[['Mo', 'We', 'Fr'], [10*60, 11*60]]`
 * returns null when fail to parse
 * @param time
 */
export function parseTimeAll(time: string): [string[], [number, number]] | null {
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

export function parseTimeAsInt(start: string, end: string): [number, number] {
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
        start_time = +t1[0] * 60 + +t1[1];
        suffix = end.substr(end.length - 2, 2);
        [hour, minute] = end.substring(0, end.length - 2).split(':');
        if (suffix === 'PM') {
            end_time = ((+hour % 12) + 12) * 60 + +minute;
        } else {
            end_time = +hour * 60 + +minute;
        }
    }
    return [start_time, end_time];
}

export function parseTimeAsString(start: string, end: string): [string, string] {
    let suffix = start.substr(start.length - 2, 2);
    let start_time: string;
    let end_time: string;
    if (suffix === 'PM') {
        let [hour, minute] = start.substring(0, start.length - 2).split(':');
        start_time = `${(+hour % 12) + 12}:${minute}`;

        [hour, minute] = end.substring(0, end.length - 2).split(':');
        end_time = `${(+hour % 12) + 12}:${minute}`;
    } else {
        start_time = start.substring(0, start.length - 2);
        suffix = end.substr(end.length - 2, 2);
        const temp = end.substring(0, end.length - 2);
        if (suffix === 'PM') {
            const [hour, minute] = temp.split(':');
            end_time = `${(+hour % 12) + 12}:${minute}`;
        } else {
            end_time = temp;
        }
    }
    return [start_time, end_time];
}

export function checkTimeConflict(timeDict1: TimeDict, timeDict2: TimeDict) {
    for (const dayBlock in timeDict1) {
        const timeBlocks2 = timeDict2[dayBlock];
        if (!timeBlocks2) {
            continue;
        }
        // if the key exists, it cannot be undefined.
        const timeBlocks1 = timeDict1[dayBlock] as number[];

        for (let i = 0; i < timeBlocks1.length; i += 2) {
            const begin = timeBlocks1[i];
            const end = timeBlocks1[i + 1];
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
 * convert 24 hour format time to 12 hour format
 * @author Kaiying Shan
 * @param time the time in 24 hour format, e.g. 17:00
 */
export function to12hr(time: string) {
    const sep = time.split(':');
    const hr = parseInt(sep[0]);
    if (hr === 12) {
        return time + 'PM';
    } else if (hr < 12) {
        return time + 'AM';
    } else {
        return hr - 12 + ':' + sep[1] + 'PM';
    }
}
