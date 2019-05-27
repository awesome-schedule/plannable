/**
 * miscellaneous utility functions
 */

/**
 *
 */
import { AxiosError } from 'axios';
import { saveAs } from 'file-saver';
import { CourseFields, Match } from '../models/Course';

/**
 * open a course detail on Lou's list
 * @author Kaiying Shan
 */
export function openLousList(semesterId: string, courseId: number) {
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
export function openVAGrade(course: CourseFields) {
    window.open(
        `https://vagrades.com/uva/${course.department.toUpperCase()}${course.number}`,
        '_blank',
        'width=650,height=700,scrollbars=yes'
    );
}

export function highlightMatch<T extends string>(str: string, expMatch: T, match?: Match<T>) {
    if (!match || match.match !== expMatch) return str;
    const { start, end } = match;
    return `${str.substring(0, start)}<span class="bg-warning">${str.substring(
        start,
        end
    )}</span>${str.substring(end)}
    `;
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
                window.setTimeout(() => {
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
