import { TimeDict, TimeBlock } from '../algorithm/ScheduleGenerator';
import Catalog from './Catalog';
import Schedule from './Schedule';
import Meta, { RawCourse } from './Meta';
import Course from './Course';
import { saveAs } from 'file-saver';
import { AxiosError } from 'axios';
import ScheduleBlock from './ScheduleBlock';

/**
 * @author Hanzhi Zhou
 * @example
 * parseTimeAll('MoWeFr 10:00AM - 11:00AM') => [['Mo', 'We', 'Fr'], [10*60, 11*60]]
 *
 * @param time
 * @returns null when fail to parse
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
 * @example
 * expect(parseTimeAll('MoWeFr 10:00AM - 11:00AM')).toEqual({
 *     Mo: [600, 660],
 *     We: [600, 660],
 *     Fr: [600, 660],
 * })
 *
 * @param time
 * @returns null when fail to parse
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
 * @example
 * parseTimeAsInt('10:00AM', '11:00AM') => [600, 660]
 *
 * @param start start time such as `10:00AM`
 * @param end  end time such as `11:00AM`
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
 *
 * @example
 * to12hr('17:00') => '5:00PM'
 *
 * @author Kaiying Shan
 * @param time the time in 24 hour format
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

/**
 * convert 12 hr to 24 hr
 *
 * @example
 * to12hr('5:00PM') => '17:00'
 *
 * @author Kaiying Shan
 * @param time
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
 * Calculate a 32 bit FNV-1a hash
 * @see https://gist.github.com/vaiorabbit/5657561
 * @see http://isthe.com/chongo/tech/comp/fnv/
 * @param str the input string to hash
 * @returns a 32-bit unsigned integer
 */
export function hashCode(str: string): number {
    let hval = 0x811c9dc5;

    for (let i = 0, l = str.length; i < l; i++) {
        hval ^= str.charCodeAt(i);
        hval += (hval << 1) + (hval << 4) + (hval << 7) + (hval << 8) + (hval << 24);
    }
    return hval >>> 0;
}

/**
 * convert `cs11105` style key to `CS 1110 Lecture`
 */
export function convertKey(cat: Catalog, schedule: Schedule, key: string) {
    const raw: RawCourse = cat.raw_data[key];
    if (raw) return `${raw[0]} ${raw[1]} ${Meta.TYPES[raw[2]]}`;
    else {
        for (const event of schedule.events) {
            if (event.key === key) {
                return event.title === '' ? key : event.title;
            }
        }
    }
    return key;
}

/**
 * open a course detail on Lou's list
 *
 * @author Kaiying Shan
 * @remarks I believe this method is copied somewhere from Lou's list
 */
export function openLousList(semesterId: number, courseId: number) {
    window.open(
        'https://rabi.phys.virginia.edu/mySIS/CS2/sectiontip.php?Semester=' +
            semesterId +
            '&ClassNumber=' +
            courseId,
        '_blank',
        'width=650,height=700,scrollbars=yes'
    );
}
/**
 * view grade distribution of this course on vagrades
 * @author Hanzhi Zhou
 */
export function openVAGrade(course: Course) {
    window.open(
        `https://vagrades.com/uva/${course.department.toUpperCase()}${course.number}`,
        '_blank',
        'width=650,height=700,scrollbars=yes'
    );
}

/**
 * Apply timeout on a promise
 *
 * @author Hanzhi Zhou
 * @param promise the promise to apply the timeout on
 * @param time time in millisecond
 * @param msg the error message on time out
 */
export function timeout<T>(
    promise: Promise<T>,
    time: number,
    msg = 'Time out fetching data. Please try again later'
): Promise<T> {
    if (time > 0) {
        return Promise.race([
            promise,
            new Promise((resolve, reject) => {
                setTimeout(() => {
                    reject(msg);
                }, time);
            })
        ]) as Promise<T>;
    } else return promise;
}

/**
 * save a string a as text file
 *
 * @author Hanzhi Zhou
 * @param str the string to save as a file
 * @param filename
 */
export function savePlain(str: string, filename: string) {
    saveAs(new Blob([str], { type: 'text/plain;charset=utf-8' }), filename);
}

/**
 * convert an (axios request) error to string message
 * @param err
 */
export function errToStr(err: string | AxiosError) {
    let errStr = '';
    if (typeof err === 'string') errStr += err;
    else if (err.response) errStr += `request rejected by the server`;
    else if (err.request) errStr += `No internet`;
    else errStr += err.message;
    return errStr;
}

/**
 * helper function used in
 * @see GridSchedule.vue
 * @see CourseBlock.vue
 * @author Kaiying Shan
 * @param time
 * @param start
 */
export function timeToNum(time: string, start: boolean) {
    const sep = time.split(':');
    const min = parseInt(sep[1]);
    let t = (parseInt(sep[0]) - 8) * 2;
    if (start) {
        if (min >= 30) {
            t += 1;
        }
    } else {
        if (min >= 30) {
            t += 1;
        }
    }
    return t;
}

interface Data<T> {
    visited: boolean;
    depth: number;
    pathDepth: number;
    parent?: T;
}

// function findMaxBreadth<T>(node: T, graph: Map<T, T[]>): T | null {
//     const neighbors = graph.get(node)!;
//     let maxBreadth = -1;
//     for (const n of neighbors) {

//     }
//     return null;
// }

/**
 * perform depth first search on a graph that has multiple connected components
 *
 * @author Hanzhi Zhou
 * @param graph the graph represented as adjacency list
 * @returns a Map that maps nodes to their data
 *
 * @see Data<T>
 */
export function depthFirstSearch<T>(graph: Map<T, T[]>): Map<T, Data<T>> {
    const visited = new Map<T, Data<T>>();
    for (const node of graph.keys()) {
        visited.set(node, { visited: false, depth: 0, pathDepth: 0 });
    }
    // the graph may have multiple connected components. Do DFS for each component
    while (true) {
        let start: T | undefined;
        let maxBreadth = -1;
        // select the first node that haven't been visited as the start node
        for (const [node, data] of visited) {
            if (!data.visited) {
                const breadth = graph.get(node)!.length;
                if (breadth > maxBreadth) {
                    maxBreadth = breadth;
                    start = node;
                }
            }
        }
        if (!start) {
            break;
        } else {
            depthFirstSearchRec(start, graph, visited);
        }
    }
    return visited;
}
/**
 * A recursive implementation of depth first search on a single connected component
 * @author Hanzhi Zhou
 * @param start
 * @param graph
 * @param visited
 */
function depthFirstSearchRec<T>(start: T, graph: Map<T, T[]>, visited: Map<T, Data<T>>) {
    // sort by breadth
    const neighbors = graph.get(start)!.sort((a, b) => {
        const d1 = graph.get(a)!;
        const d2 = graph.get(b)!;
        return d2.length - d1.length;
    });
    const curData = visited.get(start)!;
    curData.visited = true;
    let hasUnvisited = false;

    // this part is just regular DFS, except that we record the depth of the current node.
    for (const adj of neighbors) {
        const adjData = visited.get(adj)!;
        if (!adjData.visited) {
            adjData.depth = curData.depth + 1;
            adjData.parent = start;
            depthFirstSearchRec(adj, graph, visited);
            hasUnvisited = true;
        }
    }

    // if no more nodes can be visited from the current node, it is the end of this DFS path.
    // trace back the parent pointer to update parent nodes' maximum path depth.
    if (!hasUnvisited) {
        let curParent: T | undefined = start;
        curData.pathDepth = Math.max(curData.depth, curData.pathDepth);
        while (curParent) {
            const curParentData = visited.get(curParent) as Data<T>;
            curParentData.pathDepth = Math.max(curData.pathDepth, curParentData.pathDepth);
            curParent = curParentData.parent;
        }
    }
    return visited;
}
