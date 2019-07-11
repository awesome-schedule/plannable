/**
 * @module data
 * @author Hanzhi Zhou
 * Script for loading and parsing the list of semesters from Lou's list
 */

/**
 *
 */
import axios from 'axios';
import { SemesterJSON } from '../models/Catalog';
import { semesterListExpirationTime } from '../models/Meta';
import { NotiMsg } from '../store/notification';
import Expirable from './Expirable';
import { loadFromCache } from './Loader';
import { getApi } from '.';

interface SemesterListJSON extends Expirable {
    semesterList: SemesterJSON[];
}

/**
 * Try to load semester list from localStorage. If it expires or does not exist,
 * load a fresh semester list from Lou's list and store it in localStorage.
 *
 * storage key: "semesters"
 */
export function loadSemesterList(count = 5) {
    // load the cached list of semesters, if it exists
    return loadFromCache<SemesterJSON[], SemesterListJSON>(
        'semesters',
        () => requestSemesterList(count),
        x => x.semesterList,
        {
            succMsg: 'Semester list loaded',
            errMsg: x => `Failed to fetch semester list: ${x}`,
            warnMsg: x => `Failed to fetch semester list: ${x}. Old data is used`,
            expireTime: semesterListExpirationTime,
            timeoutTime: 10000
        }
    );
}

/**
 * Fetch the list of semesters from Lou's list
 */
export async function requestSemesterList(count = 5): Promise<SemesterJSON[]> {
    console.time('get semester list');
    const response = await (window.location.host === 'plannable.org'
        ? axios.get(`https://rabi.phys.virginia.edu/mySIS/CS2/index.php`)
        : axios.get(`${getApi()}/data/Semester Data/index.html`));
    console.timeEnd('get semester list');

    const element = document.createElement('html');
    element.innerHTML = response.data;
    const options = element.getElementsByTagName('option');
    const records: SemesterJSON[] = [];
    for (let i = 0; i < Math.min(count, options.length); i++) {
        const option = options[i];
        const key = option.getAttribute('value');
        if (key) {
            const semesterId = key.substr(-4);
            const html = option.innerHTML;
            records.push({
                id: semesterId,
                name: html
                    .split(' ')
                    .splice(0, 2)
                    .join(' ')
            });
        }
    }

    localStorage.setItem(
        'semesters',
        JSON.stringify({
            modified: new Date().toJSON(),
            semesterList: records
        })
    );

    return records;
}
