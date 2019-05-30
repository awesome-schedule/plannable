/**
 * @module data
 * @author Hanzhi Zhou
 */

/**
 *
 */
import Expirable from './Expirable';
import { NotiMsg } from '../store/notification';
import { errToStr, timeout } from '../utils';

/**
 * The template function that helps to load data from cache/remote
 *
 * Example usage:
 * @see [[loadTimeMatrix]],[[loadBuildingList]],[[loadSemesterList]],[[loadSemesterData]]
 *
 * @typeparam T the type of the object to construct
 * @typeparam T_JSON the JSON representation of the object T
 * @param key the key in the localStorage
 * @param request the async function used to request data from remote, if local data expires or does not exist
 * @param construct function to construct the actual object T from its JSON representation T_JSON
 * @param obj other optional config options
 * @param obj.warnMsg the warning message to return when data expired and we failed to request new data from remote
 * It takes the stringified exception as the parameter
 * @param obj.errMsg the error message to return when there is no local data and we failed to request data from remote
 * It takes the stringified exception as the parameter
 * @param obj.expireTime the expiration time of this T_JSON
 * @param obj.timeoutTime the timeout in millisecond for requesting data from remote.
 * A timeout error with appropriate error message will be thrown for
 * response that does not return within this time interval
 * @param obj.parse The parser that turns the string (or null if key does not exist) stored in local storage
 * and turns that into T_JSON or null
 * @param obj.validator The validator that checks whether the return value of the parser is a valid T_JSON object
 * @param obj.force whether this is a forced update
 */
export async function loadFromCache<T, T_JSON extends Expirable>(
    key: string,
    request: () => Promise<T>,
    construct: (x: T_JSON) => T,
    {
        warnMsg = x => x,
        errMsg = x => x,
        infoMsg = 'Success',
        expireTime = Infinity,
        timeoutTime = -1,
        parse = x => (x ? JSON.parse(x) : null),
        validator = defaultValidator,
        force = false
    }: {
        warnMsg?: (err: string) => string;
        errMsg?: (err: string) => string;
        infoMsg?: string;
        expireTime?: number;
        timeoutTime?: number;
        parse?: (x: string | null) => T_JSON | null;
        validator?: (x: T_JSON | null) => x is T_JSON;
        force?: boolean;
    }
): Promise<NotiMsg<T>> {
    const storage = localStorage.getItem(key);
    const data: T_JSON | null = parse(storage);
    if (validator(data)) {
        // expired
        if (new Date().getTime() - new Date(data.modified).getTime() > expireTime || force) {
            try {
                return {
                    payload: await timeout(request(), timeoutTime),
                    msg: infoMsg,
                    level: 'info'
                };
            } catch (err) {
                // expired (or force update) but failed to request new data: use the old data and gives a warning
                return {
                    payload: construct(data),
                    msg: warnMsg(errToStr(err)),
                    level: 'warn'
                };
            }
        } else {
            return {
                payload: construct(data),
                msg: infoMsg,
                level: 'info'
            };
        }
        // data invalid or does not exist
    } else {
        try {
            return {
                payload: await timeout(request(), timeoutTime),
                msg: infoMsg,
                level: 'info'
            };
        } catch (err) {
            return {
                msg: errMsg(errToStr(err)),
                level: 'error'
            };
        }
    }
}

function defaultValidator<T_JSON extends Expirable>(x: T_JSON | null): x is T_JSON {
    return !!x && !!x.modified;
}
