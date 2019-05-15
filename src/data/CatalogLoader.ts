/**
 * Script for loading the catalog for a given semester
 * @author Hanzhi Zhou, Kaiying Shan
 */

/**
 *
 */
import axios from 'axios';
import { parse } from 'papaparse';
import querystring from 'querystring';
import Meta, { RawCatalog, RawSection, RawMeeting } from '../models/Meta';
import Catalog, { Semester, CatalogJSON } from '../models/Catalog';
import { NotiMsg } from '../store/notification';
import { loadFromCache } from './Loader';

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
    return loadFromCache<Catalog, CatalogJSON>(
        `${semester.id}data`,
        () => requestSemesterData(semester),
        x => Catalog.fromJSON(x),
        {
            errMsg: x => `Failed to fetch ${semester.name} data: ${x}`,
            warnMsg: x => `Failed to fetch ${semester.name} data: ${x}. Old data is used`,
            infoMsg: `Successfully loaded ${semester.name} data!`,
            expireTime: Meta.semesterDataExpirationTime,
            timeoutTime: 10000,
            force
        }
    );
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

    const res = await (window.location.host.indexOf('cn.plannable.org') === -1
        ? axios.post(
              `https://rabi.phys.virginia.edu/mySIS/CS2/deliverData.php`,
              querystring.stringify({
                  Semester: semester.id,
                  Group: 'CS',
                  Description: 'Yes',
                  submit: 'Submit Data Request',
                  Extended: 'Yes'
              })
          )
        : axios.get(`https://cn.plannable.org/data/Semester%20Data/CS${semester.id}Data.csv`));
    console.timeEnd(`request semester ${semester.name} data`);

    const parsed = parseSemesterData(res.data);
    const catalog = new Catalog(semester, parsed, new Date().toString());
    saveCatalog(catalog);
    return catalog;
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
        const meetings: RawMeeting[] = [];
        const s = new Set<string>();
        for (let i = 0; i < 4; i++) {
            const start = 6 + i * 4; // meeting information starts at index 6
            if (data[start]) {
                if (s.has(data[start + 1])) {
                    continue;
                }

                s.add(data[start + 1]);

                const tempMeeting: RawMeeting = [
                    data[start],
                    data[start + 1],
                    data[start + 2],
                    data[start + 3]
                ];
                meetings.push(tempMeeting);
            }
        }

        meetings.sort((a, b) => (a[1] === b[1] ? 0 : a[1] < b[1] ? -1 : 1));

        const tempSection: RawSection = [
            parseInt(data[0]),
            data[3],
            data[23],
            STATUSES[data[24]],
            parseInt(data[25]),
            parseInt(data[26]),
            parseInt(data[27]),
            meetings
        ];

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
