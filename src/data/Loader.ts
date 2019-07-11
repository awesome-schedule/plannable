/**
 * @module data
 * @author Hanzhi Zhou
 */

/**
 *
 */
import Expirable from './Expirable';
import { NotiMsg } from '../store/notification';
import { errToStr, timeout, cancelablePromise, CancelablePromise } from '../utils';

interface LoaderOptions<T, T_JSON extends Expirable> {
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
     * the expiration time of this T_JSON
     */
    expireTime?: number;
    /**
     * the timeout in millisecond for requesting data from remote.
     * A timeout error with appropriate error message will be thrown for
     * response that does not return within this time interval
     */
    timeoutTime?: number;
    /**
     * The parser that turns the string (or null if key does not exist)
     * stored in local storage into T_JSON or null
     */
    parse?: (x: string | null) => T_JSON | null;
    /**
     * The validator that checks whether the return value of the parser is a valid T_JSON object
     */
    validator?: (x: T_JSON | null) => x is T_JSON;
    /**
     * whether this is a forced update. If true, request the data from remote with no regard to local data
     */
    force?: boolean;
}

/**
 * The template function that helps to load data from cache/remote
 *
 * Example usage:
 * @see [[loadTimeMatrix]],[[loadBuildingList]],[[loadSemesterList]],[[loadSemesterData]]
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
        validator = defaultValidator,
        force = false
    }: LoaderOptions<T, T_JSON>
): { new: CancelablePromise<T>; old?: T } {
    const storage = localStorage.getItem(key);
    const data: T_JSON | null = parse(storage);
    if (validator(data)) {
        // expired
        if (new Date().getTime() - new Date(data.modified).getTime() > expireTime || force) {
            return {
                new: cancelablePromise(request()),
                old: construct(data)
            };
        } else {
            return {
                new: cancelablePromise(Promise.resolve(construct(data)))
            };
        }
        // data invalid or does not exist
    } else {
        return {
            new: cancelablePromise(request())
        };
    }
}

function defaultValidator<T_JSON extends Expirable>(x: T_JSON | null): x is T_JSON {
    return !!x && !!x.modified;
}
