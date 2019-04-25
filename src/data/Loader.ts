import Expirable from './Expirable';
import { NotiMsg } from '../models/Notification';
import { errToStr, timeout } from '../models/Utils';

export async function loadFromCache<T, T_JSON extends Expirable>(
    key: string,
    {
        request,
        construct,
        warnMsg,
        errMsg,
        infoMsg = '',
        expireTime = Infinity,
        timeoutTime = -1,
        parse = x => (x ? JSON.parse(x) : x),
        validator = defaultValidator,
        force = false
    }: {
        request: () => Promise<T>;
        construct: (x: T_JSON) => T;
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
