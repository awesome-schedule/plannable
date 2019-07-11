/**
 * @module data
 * @author Hanzhi Zhou, Kaiying Shan
 * Script for loading the catalog for a given semester
 */

/**
 *
 */
import axios from 'axios';
import { parse } from 'papaparse';
import { stringify } from 'querystring';
import Catalog, { CatalogJSON, SemesterJSON } from '../models/Catalog';
import {
    RawCatalog,
    RawMeeting,
    RawSection,
    CourseStatus,
    semesterDataExpirationTime,
    TYPES_PARSE,
    STATUSES_PARSE,
    CourseType
} from '../models/Meta';
import { loadFromCache } from './Loader';
import { getApi } from '.';

/**
 * Try to load semester data from `localStorage`. If data expires/does not exist, fetch a fresh
 * set of data from Lou's list and save to `localStorage`.
 *
 * storage key: 1198data
 *
 * @param semester the semester to load data
 * @param force force update
 */
export function loadSemesterData(semester: SemesterJSON, force = false) {
    return loadFromCache<Catalog, CatalogJSON>(
        `${semester.id}data`,
        () => requestSemesterData(semester),
        x => Catalog.fromJSON(x),
        {
            expireTime: semesterDataExpirationTime,
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

export async function requestSemesterData(semester: SemesterJSON): Promise<Catalog> {
    console.time(`request semester ${semester.name} data`);

    const res = await (window.location.host === 'plannable.org' || true // Running on GitHub pages (primary address)?
        ? axios.post(
              `https://rabi.phys.virginia.edu/mySIS/CS2/deliverData.php`, // yes
              stringify({
                  Semester: semester.id,
                  Group: 'CS',
                  Description: 'Yes',
                  submit: 'Submit Data Request',
                  Extended: 'Yes'
              })
          ) // use the mirror/local dev server
        : axios.get(`${getApi()}/data/Semester%20Data/CS${semester.id}Data.csv`));
    console.timeEnd(`request semester ${semester.name} data`);

    const parsed = parseSemesterData(res.data);
    const catalog = new Catalog(semester, parsed, new Date().toJSON());
    saveCatalog(catalog);
    return catalog;
}

export function parseSemesterData(csv_string: string) {
    const CLASS_TYPES = TYPES_PARSE;
    const STATUSES = STATUSES_PARSE;
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

        // todo: robust data validation
        const type = CLASS_TYPES[data[4] as CourseType];
        const key = (data[1] + data[2] + type).toLowerCase();
        const meetings: RawMeeting[] = [];
        const s = new Set<string>();
        for (let i = 0; i < 4; i++) {
            const start = 6 + i * 4; // meeting information starts at index 6
            if (data[start]) {
                // remove duplicated course meeting time
                // but what does that even exist in the first place?
                if (s.has(data[start + 1])) continue;

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
            STATUSES[data[24] as CourseStatus],
            +data[25],
            +data[26],
            +data[27],
            meetings
        ];

        if (rawCatalog[key]) {
            rawCatalog[key][6].push(tempSection);
        } else {
            rawCatalog[key] = [data[1], +data[2], type, data[5], data[22], data[28], [tempSection]];
        }
    }

    console.timeEnd('reorganizing data');
    return rawCatalog;
}
