/**
 * @module src/data
 * @author Hanzhi Zhou
 * Script for loading and parsing the list of semesters from Lou's list
 */

/**
 *
 */
import { SemesterJSON } from '../models/Catalog';
import Expirable from './Expirable';
import { fallback, loadFromCache } from './Loader';
import { dataend, semesterListExpirationTime } from '@/config';

interface SemesterListJSON extends Expirable {
    semesters: SemesterJSON[];
}

/**
 * Try to load semester list from localStorage. If it expires or does not exist,
 * load a fresh semester list from Lou's list and store it in localStorage.
 *
 * storage key: "semesters"
 */
export function loadSemesterList(count = 10) {
    // load the cached list of semesters, if it exists
    return fallback(
        loadFromCache<SemesterJSON[], SemesterListJSON>(
            'semesters',
            () => dataend.semesters(count),
            x => x.semesters,
            {
                expireTime: semesterListExpirationTime,
                validator(x): x is SemesterListJSON {
                    return !!x && !!x.modified && !!x.semesters;
                }
            }
        ),
        {
            succMsg: 'Semester list loaded',
            errMsg: x => `Failed to fetch semester list: ${x}`,
            warnMsg: x => `Failed to fetch semester list: ${x}. Old data is used`,
            timeoutTime: 10000
        }
    );
}
