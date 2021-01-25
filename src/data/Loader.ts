/**
 * @module src/data
 * @author Hanzhi Zhou
 */

/**
 *
 */
import { NotiMsg } from '../store/notification';
import { cancelablePromise, CancelablePromise, errToStr, timeout } from '../utils';
import Expirable from './Expirable';

function defaultValidator<T_JSON extends Expirable>(x: T_JSON | null): x is T_JSON {
    return !!x && !!x.modified;
}

interface LoaderOptions<T, T_JSON extends Expirable> {
    /**
     * the expiration time of this T_JSON
     */
    expireTime?: number;
    /**
     * The parser that turns the string (or null if key does not exist)
     * stored in local storage into T_JSON or null
     */
    parse?: (x: string | null) => T_JSON | null;
    /**
     * the function to store x in localStorage
     */
    store?: (x: T) => T;
    /**
     * The validator that checks whether the return value of the parser is a valid T_JSON object
     */
    validator?: (x: T_JSON | null) => x is T_JSON;
    /**
     * whether this is a forced update. If true, request the data from remote with no regard to local data
     */
    force?: boolean;
}

/** an object that can be used as the `temp` argument of the [[fallback]] function */
export interface FallBackable<T> {
    /** represents a pending request to load new data */
    new: CancelablePromise<T>;
    /** represents already loaded old data (probably retrieved from cache) */
    old?: T;
}

interface FallbackOptions {
    /**
     * the warning message to return when data expired and we failed to request new data from remote.
     * It takes the stringified exception as the parameter
     */
    warnMsg?: (err: string) => string;
    /**
     * the error message to return when there is no local data and we failed to request data from remote
     * It takes the stringified exception as the parameter
     */
    errMsg?: (err: string) => string;
    /**
     * the success message shown when data is loaded successfully
     */
    succMsg?: string;
    /**
     * the timeout in millisecond for requesting data from remote.
     * A timeout error with appropriate error message will be thrown for
     * response that does not return within this time interval
     */
    timeoutTime?: number;
}

/**
 * The template function that helps to load data from cache/remote
 *
 * Example usage:
 * @see [[loadTimeMatrix]],[[loadBuildingSearcher]],[[loadSemesterList]],[[loadSemesterData]]
 *
 * @typeparam T the type of the object to construct
 * @typeparam T_JSON the JSON-serializable representation of the object T
 * @param key the key in the localStorage
 * @param request the async function used to request data from remote, if local data expires or does not exist
 * @param construct function to construct the actual object T from its JSON-serializable representation T_JSON
 */
export function loadFromCache<T, T_JSON extends Expirable>(
    key: string,
    request: () => Promise<T>,
    construct: (x: T_JSON) => T,
    {
        expireTime = Infinity,
        parse = x => (x ? JSON.parse(x) : null),
        store = x => {
            localStorage.setItem(
                key,
                JSON.stringify({
                    modified: new Date(),
                    [key]: x
                })
            );
            return x;
        },
        validator = defaultValidator,
        force = false
    }: LoaderOptions<T, T_JSON>
): FallBackable<T> {
    const storage = localStorage.getItem(key);
    const data = parse(storage);
    if (validator(data)) {
        // if expired, request data from remote
        if (new Date().getTime() - new Date(data.modified).getTime() > expireTime || force) {
            const newData = cancelablePromise(request().then(store));
            try {
                return {
                    new: newData,
                    old: construct(data)
                };
            } catch (err) {
                console.error(err);
                return {
                    new: newData
                };
            }
        } else {
            return {
                new: cancelablePromise(Promise.resolve(construct(data)))
            };
        }
        // data invalid or does not exist
    } else {
        return {
            new: cancelablePromise(request().then(store))
        };
    }
}

/**
 * Await the promise on temp.new to resolve. If timed out, return the old data on temp.old.
 * @returns the payload with an appropriate message
 * @param temp
 */
export async function fallback<T>(
    temp: FallBackable<T>,
    { succMsg = '', warnMsg = x => x, errMsg = x => x, timeoutTime = 5000 }: FallbackOptions = {}
): Promise<NotiMsg<T>> {
    try {
        const payload = await timeout(temp.new, timeoutTime);
        return {
            payload,
            msg: succMsg,
            level: 'success'
        };
    } catch (err2) {
        return temp.old
            ? {
                  payload: temp.old,
                  msg: warnMsg(errToStr(err2)),
                  level: 'warn'
              }
            : {
                  msg: errMsg(errToStr(err2)),
                  level: 'error'
              };
    }
}
