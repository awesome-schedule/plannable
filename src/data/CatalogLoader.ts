import axios from 'axios';
import { parse } from 'papaparse';
import querystring from 'querystring';
import Meta, { RawCatalog, RawSection, RawMeeting } from '../models/Meta';
import Catalog, { Semester } from '../models/Catalog';
import { NotiMsg } from '@/models/Notification';
import { errToStr } from '@/models/Utils';

/**
 * Try to load semester data from `localStorage`. If data expires/does not exist, fetch a fresh
 * set of data from Lou's list and save to `localStorage`.
 *
 * storage key: 1198data
 *
 * @param idx index of the semester to load data
 * @param force force update
 */
export async function loadSemesterData(idx: number, force = false): Promise<NotiMsg<Catalog>> {
    const semester = window.semesters[idx];
    const allRecords_raw = localStorage.getItem(`${semester.id}data`);
    const temp = allRecords_raw ? Catalog.fromJSON(JSON.parse(allRecords_raw)) : null;
    const successMsg = `Successfully loaded ${semester.name} data!`;

    // if data does not exist or is not in correct format
    if (temp === null) {
        try {
            return {
                payload: window.catalog = await requestSemesterData(semester),
                msg: successMsg,
                level: 'info'
            };
        } catch (err) {
            return {
                msg: `Failed to fetch ${semester.name} data: ${errToStr(err)}`,
                level: 'error'
            };
        }
    } else {
        // if data expired
        if (temp.expired || force) {
            // in this case, we only need to update window.catalog. Save a set of fresh data
            try {
                return {
                    payload: window.catalog = await requestSemesterData(semester),
                    msg: `Successfully updated ${semester.name} data!`,
                    level: 'info'
                };
            } catch (err) {
                return {
                    payload: window.catalog = temp.catalog,
                    msg: `Failed to fetch ${semester.name} data: ${errToStr(
                        err
                    )}. Old data is used`,
                    level: 'warn'
                };
            }
        } else {
            return {
                payload: window.catalog = temp.catalog,
                msg: successMsg,
                level: 'info'
            };
        }
    }
}

function saveCatalog(catalog: Catalog) {
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.endsWith('data')) {
            localStorage.removeItem(key);
        }
    }
    localStorage.setItem(`${catalog.semester.id}data`, JSON.stringify(catalog.toJSON()));
}

export async function requestSemesterData(semester: Semester): Promise<Catalog> {
    console.time(`request semester ${semester.name} data`);

    const res = await axios.post(
        `https://rabi.phys.virginia.edu/mySIS/CS2/deliverData.php`,
        querystring.stringify({
            Semester: semester.id,
            Group: 'CS',
            Description: 'Yes',
            submit: 'Submit Data Request',
            Extended: 'Yes'
        })
    );
    console.timeEnd(`request semester ${semester.name} data`);

    const parsed = parseSemesterData(res.data);
    const catalog = new Catalog(semester, parsed);
    saveCatalog(catalog);
    return (window.catalog = catalog);
}

export function parseSemesterData(csv_string: string) {
    const CLASS_TYPES = Meta.TYPES_PARSE;
    const STATUSES = Meta.STATUSES_PARSE;
    console.time('parsing csv');
    const raw_data: string[][] = parse(csv_string, {
        skipEmptyLines: true,
        header: false
    }).data;
    console.timeEnd('parsing csv');
    console.time('reorganizing data');

    const rawCatalog: RawCatalog = Object.create(null);

    for (let j = 1; j < raw_data.length; j++) {
        const data = raw_data[j];
        const key = (data[1] + data[2] + CLASS_TYPES[data[4]]).toLowerCase();
        const tempSection: RawSection = [
            parseInt(data[0]),
            data[3],
            data[23],
            STATUSES[data[24]],
            parseInt(data[25]),
            parseInt(data[26]),
            parseInt(data[27]),
            []
        ];
        const meetings: RawMeeting[] = [];
        for (let i = 0; i < 4; i++) {
            if (data[6 + i * 4] && data[6 + i * 4] !== '') {
                const tempMeeting: RawMeeting = [
                    data[6 + i * 4],
                    data[6 + i * 4 + 1],
                    data[6 + i * 4 + 2],
                    data[6 + i * 4 + 3]
                ];
                meetings.push(tempMeeting);
            }
        }
        tempSection[7] = meetings;
        if (rawCatalog[key]) {
            rawCatalog[key][6].push(tempSection);
        } else {
            rawCatalog[key] = [
                data[1],
                parseInt(data[2]),
                CLASS_TYPES[data[4]],
                data[5],
                data[22],
                data[28],
                [tempSection]
            ];
        }
    }

    console.timeEnd('reorganizing data');
    return rawCatalog;
}
