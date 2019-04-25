import axios from 'axios';
import { Semester } from '../models/Catalog';
import { timeout, errToStr } from '../models/Utils';
import Meta from '@/models/Meta';
import { NotiMsg } from '../models/Notification';

interface SemesterListJSON {
    modified: string;
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
    const storage = localStorage.getItem('semesters');
    const successMsg = `Successfully loaded semester list!`;
    if (!storage) {
        try {
            return {
                payload: window.semesters = await timeout(requestSemesterList(count), 10000),
                msg: successMsg,
                level: 'info'
            };
        } catch (err) {
            return {
                msg: `Failed to fetch semester list: ${errToStr(err)}`,
                level: 'error'
            };
        }
    }
    const raw: SemesterListJSON = JSON.parse(storage);
    const modified = raw.modified;

    // if data exists and is not expired
    if (
        modified &&
        new Date().getTime() - new Date(modified).getTime() < Meta.semesterListExpirationTime
    ) {
        return {
            payload: window.semesters = raw.semesterList,
            msg: successMsg,
            level: 'info'
        };
    } else {
        try {
            // try to fetch a fresh list of semesters
            return {
                payload: window.semesters = await timeout(requestSemesterList(count), 10000),
                msg: successMsg,
                level: 'info'
            };
        } catch (err) {
            // if failed, use old data
            return {
                payload: window.semesters = raw.semesterList,
                msg: `Failed to fetch semester list: ${errToStr(err)}. Old data is used instead`,
                level: 'info'
            };
        }
    }
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
