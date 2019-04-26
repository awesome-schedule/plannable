import Expirable from './Expirable';
import { NotiMsg } from '../models/Notification';
import { errToStr, timeout } from '../models/Utils';

/**
 * @template T the type of the object to construct
 * @template T_JSON the JSON representation of the object T
 * @param key the key in the localStorage
 * @param request the async function used to request data from remote, if local data expires or does not exist
 * @param construct function to construct the actual object T from its JSON representation
 * @param param3 other params
 */
export async function loadFromCache<T, T_JSON extends Expirable>(
    key: string,
    request: () => Promise<T>,
    construct: (x: T_JSON) => T,
    {
        warnMsg,
        errMsg,
        infoMsg = '',
        expireTime = Infinity,
        timeoutTime = -1,
        parse = x => (x ? JSON.parse(x) : x),
        validator = defaultValidator,
        force = false
    }: {
        warnMsg: (err: string) => string;
        errMsg: (err: string) => string;
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
                level: 'warn'
            };
        }
    }
}

function defaultValidator<T_JSON extends Expirable>(x: T_JSON | null): x is T_JSON {
    return !!x && !!x.modified;
}
