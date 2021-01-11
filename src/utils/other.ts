/**
 * miscellaneous utility functions
 * @module src/utils
 */

/**
 *
 */
import axios, { AxiosError } from 'axios';
import { saveAs } from 'file-saver';
import { Match } from '../models/Course';

/**
 * highlight a matched part of a short string given that `match` is not undefined and `match.match === expMatch`
 * @author Hanzhi Zhou
 * @param str the string to inject highlight
 * @param expMatch the expected matched field in match.match
 * @param matches an array of match objects, sorted in numeric order of their `start` property
 */
export function highlightMatch<T extends string>(
    str: string,
    expMatch: T,
    matches?: readonly Match<T>[]
) {
    if (!matches || !matches.length) return str;
    let result = '';
    let lastEnd = 0;
    for (const { match, start, end } of matches) {
        if (match === expMatch) {
            result += `${str.substring(lastEnd, start)}<span class="bg-warning">${str.substring(
                start,
                end
            )}</span>`;
            lastEnd = end;
        }
    }
    return result + str.substring(lastEnd);
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

    for (let i = 0; i < str.length; i++) {
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
        const p = cancelablePromise(promise);
        setTimeout(() => p.cancel(msg), time);
        return p;
    } else return promise;
}

type Cancel = (msg: any) => void;
export interface CancelablePromise<T> extends Promise<T> {
    cancel: Cancel;
}
/**
 * wrap a promise and return a new promise with a `cancel` method
 * @author Hanzhi Zhou
 * @param promise
 */
export function cancelablePromise<T>(promise: Promise<T>) {
    let cancel: Cancel;
    const p = new Promise((resolve, reject) => {
        promise.then(res => resolve(res)).catch(err => reject(err));
        cancel = reason => reject(reason);
    }) as CancelablePromise<T>;
    p.cancel = cancel!;
    return p;
}

/**
 * save a string a as text file
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
 * @author Hanzhi Zhou
 */
export function errToStr(err: string | AxiosError) {
    let errStr = '';
    if (typeof err === 'string') errStr += err;
    else if (err.response) errStr += `request rejected by the server`;
    else if (err.request) errStr += `No internet`;
    else errStr += err.message;
    return errStr;
}

export function isNumberArray(x: any): x is number[] {
    return Array.isArray(x) && typeof x[0] === 'number';
}

export function isStringArray(x: any): x is string[] {
    return x instanceof Array && typeof x[0] === 'string';
}

/**
 * Get release note for current version && render.
 * Part of this function can be seen as an extremely-lightweight MarkDown renderer.
 * @author Kaiying Cat
 */
export async function getReleaseNote() {
    try {
        const res = await axios.get(
            'https://api.github.com/repos/awesome-schedule/plannable/releases'
        );

        const promises = [];
        const notes: string[] = [];

        for (let i = 0; i < Math.min(3, res.data.length); i++) {
            promises.push(
                axios.post('https://api.github.com/markdown', {
                    text: res.data[i].body,
                    mode: 'gfm',
                    context: 'github/gollum'
                })
            );
        }

        await Promise.all(promises).then(values => {
            for (let i = 0; i < values.length; i++) {
                notes.push(
                    '<div class="card"> <div class="card-body"> <div class="card-title"> <h6 style="list-style:none; padding-left: 0">' +
                        res.data[i].name +
                        '</h6> <hr> </div>' +
                        values[i].data +
                        '</div> </div>'
                );
            }
        });

        return notes.join('<br>');
    } catch (err) {
        console.error(err);
        return (
            'Failed to obtain release note.' +
            ' See https://github.com/awesome-schedule/plannable/releases instead.'
        );
    }
}

export async function viewReleaseNote() {
    const note = await getReleaseNote();
    $('#release-note-body').html(note);
    $('#versionModal').modal();
}

export class GeneratedError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'GeneratedError';
    }
}
