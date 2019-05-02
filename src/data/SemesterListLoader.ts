import axios from 'axios';
import { Semester } from '../models/Catalog';
import Meta from '../models/Meta';
import { NotiMsg } from '../utils/Notification';
import Expirable from './Expirable';
import { loadFromCache } from './Loader';

interface SemesterListJSON extends Expirable {
    semesterList: Semester[];
}

/**
 * Try to load semester list from localStorage. If it expires or does not exist,
 * load a fresh semester list from Lou's list and store it in localStorage.
 *
 * storage key: "semesters"
 */
export async function loadSemesterList(count = 5): Promise<NotiMsg<Semester[]>> {
    // load the cached list of semesters, if it exists
    return loadFromCache<Semester[], SemesterListJSON>(
        'semesters',
        () => requestSemesterList(count),
        x => x.semesterList,
        {
            infoMsg: 'Semester list loaded',
            errMsg: x => `Failed to fetch semester list: ${x}`,
            warnMsg: x => `Failed to fetch semester list: ${x}. Old data is used`,
            expireTime: Meta.semesterListExpirationTime,
            timeoutTime: 10000
        }
    );
}

/**
 * Fetch the list of semesters from Lou's list
 */
export async function requestSemesterList(count = 5): Promise<Semester[]> {
    console.time('get semester list');
    const response = await axios.get(`https://rabi.phys.virginia.edu/mySIS/CS2/index.php`);
    console.timeEnd('get semester list');

    const element = document.createElement('html');
    element.innerHTML = response.data;
    const options = element.getElementsByTagName('option');
    const records: Semester[] = [];
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
