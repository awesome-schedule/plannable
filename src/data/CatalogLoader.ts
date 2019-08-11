/**
 * @module data
 * @author Hanzhi Zhou, Kaiying Shan
 * Script for loading the catalog for a given semester
 */

/**
 *
 */
import CatalogDB, { CourseTableItem, MeetingTableItem, SectionTableItem } from '@/database/CatalogDB';
import { ValidFlag } from '@/models/Section';
import axios from 'axios';
import { parse } from 'papaparse';
import { stringify } from 'querystring';
import { getApi } from '.';
import Catalog, { CatalogJSON, SemesterJSON } from '../models/Catalog';

import {
    CourseStatus,
    CourseType,
    RawCatalog,
    RawMeeting,
    RawSection,
    semesterDataExpirationTime,
    STATUSES_PARSE,
    TYPES_PARSE
} from '../models/Meta';
import { cancelablePromise, CancelablePromise, errToStr, timeout } from '../utils';
import { loadFromCache } from './Loader';

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

export async function loadSemesterData2(semester: SemesterJSON, force = false) {
    const t = localStorage.getItem('idb_time');
    const s = localStorage.getItem('idb_semester');
    const db = new CatalogDB();
    let old: Catalog | undefined;
    let newCat: Promise<Catalog>;

    if (s !== semester.id || !t) {
        newCat = cancelablePromise(getSemesterData(semester, db, force));
    } else if (new Date().getTime() - +t > 1000 * 60 * 60) {
        newCat = cancelablePromise(getSemesterData(semester, db, force));
        const temp = await retrieveFromDB(db);
        old = new Catalog(semester, temp, new Date(+t).toJSON());
    } else {
        newCat = cancelablePromise(getSemesterData(semester, db, force));
    }
    return {
        new: newCat,
        old
    } as { new: CancelablePromise<Catalog>; old?: Catalog | undefined; };
    // { new: Promise<Catalog>; old?: Catalog | undefined; }
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

    const res = await (window.location.host === 'plannable.org' // Running on GitHub pages (primary address)?
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
        : axios.get(
            `${getApi()}/data/Semester%20Data/CS${semester.id}Data.csv?time=${Math.random()}`
        ));
    console.timeEnd(`request semester ${semester.name} data`);

    const parsed = parseSemesterData(res.data);
    const catalog = new Catalog(semester, parsed, new Date().toJSON());
    saveCatalog(catalog);
    return catalog;
}

export async function getSemesterData(currentSemester: SemesterJSON, db: CatalogDB, force = false): Promise<Catalog> {
    const t = localStorage.getItem('idb_time');
    const s = localStorage.getItem('idb_semester');
    if (!t || (new Date()).getTime() - +t > 60 * 60 * 1000 || force || s !== currentSemester.id) {
        await db.courses.clear();
        await db.sections.clear();
        await db.meetings.clear();
        const raw_data = await requestSemesterData2(currentSemester);
        const ctlg = parseSemesterData2(raw_data, db, currentSemester);
        return new Catalog(currentSemester, ctlg, new Date().toJSON());
    } else {
        const ctlg = await retrieveFromDB(db);
        return new Catalog(currentSemester, ctlg, new Date().toJSON());
    }
}

export async function requestSemesterData2(semester: SemesterJSON) {
    console.time(`request semester ${semester.name} data`);

    const res = await (window.location.host === 'plannable.org' // Running on GitHub pages (primary address)?
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
        : axios.get(
            `${getApi()}/data/Semester%20Data/CS${semester.id}Data.csv?time=${Math.random()}`
        ));
    console.timeEnd(`request semester ${semester.name} data`);
    const data: string[][] = parse(res.data, {
        skipEmptyLines: true,
        header: false
    }).data;
    return data;
}

export function parseSemesterData2(raw_data: string[][], db: CatalogDB, currentSemester: SemesterJSON) {
    console.time('parse semester data and store');
    const CLASS_TYPES = TYPES_PARSE;
    const STATUSES = STATUSES_PARSE;
    const rawCatalog: RawCatalog = {};
    const secFKs: { [key: string]: number[] } = {};
    const crsId: string[] = [];
    const len = raw_data.length;
    let meetingId = 0;
    const meetingArr: MeetingTableItem[] = [];
    const sectionArr: SectionTableItem[] = [];
    for (let j = 1; j < len; j++) {
        const data = raw_data[j];

        // todo: robust data validation
        const type = CLASS_TYPES[data[4] as CourseType];
        const key = (data[1] + data[2] + type).toLowerCase();
        const meetings: RawMeeting[] = [];
        const meetingFK: number[] = [];
        let date: string = data[6 + 3];
        let valid: ValidFlag = 0;
        for (let i = 0; i < 4; i++) {
            const start = 6 + i * 4; // meeting information starts at index 6
            const a = data[start],
                b = data[start + 1],
                c = data[start + 2];
            if (a || b || c) {
                const meetingDate = data[start + 3];
                if (!date) date = meetingDate;
                // inconsistent date
                if (meetingDate && meetingDate !== date) valid |= 2;

                // incomplete information
                if (!a || !c || a === 'TBA' || c === 'TBA' || a === 'TBD' || c === 'TBD')
                    valid |= 1;

                // unknown meeting time
                if (!b || b === 'TBA' || b === 'TBD') {
                    valid |= 4;
                } else {
                    const [, startT, , endT] = b.split(' ');
                    // invalid meeting time
                    if (startT === endT) valid |= 4;
                }

                // insertion sort
                let k = 0;
                for (; k < meetings.length; k++) {
                    if (b < meetings[k][1]) break;
                }
                meetings.splice(k, 0, [a, b, c]);
                // await db.meetings.add({ instructor: a, days: b, room: c }).then(id => meetingFK.push(id));
                meetingArr.push({ id: meetingId, instructor: a, days: b, room: c });
                meetingFK.push(meetingId);
                meetingId++;
            }
        }
        date = date || '';
        // unknown date
        if (!date || date === 'TBD' || date === 'TBA') valid |= 8;

        const tempSection: RawSection = [
            +data[0],
            data[3],
            data[23],
            STATUSES[data[24] as CourseStatus],
            +data[25],
            +data[26],
            +data[27],
            date,
            valid,
            meetings
        ];

        sectionArr.push({
            id: tempSection[0],
            sid: tempSection[1],
            topic: tempSection[2],
            status: tempSection[3],
            enrollment: tempSection[4],
            enrollment_limit: tempSection[5],
            wait_list: tempSection[6],
            date: tempSection[7],
            valid: tempSection[8],
            meetings: meetingFK
        });

        if (rawCatalog[key]) {
            rawCatalog[key][6].push(tempSection);
            secFKs[key].push(tempSection[0]);
        } else {
            crsId.push(key);
            rawCatalog[key] = [data[1], +data[2], type, data[5], data[22], data[28], [tempSection]];
            secFKs[key] = [tempSection[0]];
        }
    }
    const courseItemArr: CourseTableItem[] = [];
    for (const key of crsId) {
        const course = rawCatalog[key];
        courseItemArr.push({
            id: key,
            department: course[0],
            number: course[1],
            type: course[2],
            units: course[3],
            title: course[4],
            description: course[5],
            sections: secFKs[key]
        });
    }
    Promise.all([
        db.courses.bulkAdd(courseItemArr),
        db.sections.bulkAdd(sectionArr),
        db.meetings.bulkAdd(meetingArr)
    ]).then(x => {
        localStorage.setItem('idb_time', (new Date()).getTime().toString());
        localStorage.setItem('idb_semester', currentSemester.id);
    });
    console.timeEnd('parse semester data and store');
    return rawCatalog;
}

export async function retrieveFromDB(db: CatalogDB) {
    console.time('retrieve from db');
    const rawCatalog: RawCatalog = {};
    const courseArr: CourseTableItem[] = [];
    console.time('get courses from db');

    const secMap: Map<number, SectionTableItem> = new Map();
    const mtMap: Map<number, MeetingTableItem> = new Map();

    await Promise.all([
        db.courses.toArray(arr => arr.forEach(crs => {
            if (!crs || !crs.id) return;
            courseArr.push(crs);
        })),
        db.sections.toArray(arr => arr.forEach(sec => {
            if (!sec || !sec.id) return;
            secMap.set(sec.id as number, sec);
        })),
        db.meetings.toArray(arr => arr.forEach(mt => {
            mtMap.set(mt.id as number, mt);
        }))
    ]);

    console.timeEnd('get courses from db');

    for (const crs of courseArr) {
        if (!crs || !crs.id) continue;
        const sectionArr: RawSection[] = [];
        for (const secId of crs.sections) {
            const sec = secMap.get(secId);
            if (!sec) continue;
            const meetingArr: RawMeeting[] = sec.meetings.map(mid => {
                const mt = mtMap.get(mid) as MeetingTableItem;

                return [mt.instructor, mt.days, mt.room];
            });

            const rawSec = [
                sec.id as number,
                sec.sid,
                sec.topic,
                sec.status,
                sec.enrollment,
                sec.enrollment_limit,
                sec.wait_list,
                sec.date,
                sec.valid,
                meetingArr
            ] as RawSection;
            sectionArr.push(rawSec);
        }
        rawCatalog[crs.id] = [
            crs.department,
            crs.number,
            crs.type,
            crs.units,
            crs.title,
            crs.description,
            sectionArr
        ];
    }
    console.timeEnd('retrieve from db');
    return rawCatalog;
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
    const len = raw_data.length;
    for (let j = 1; j < len; j++) {
        const data = raw_data[j];

        // todo: robust data validation
        const type = CLASS_TYPES[data[4] as CourseType];
        const key = (data[1] + data[2] + type).toLowerCase();
        const meetings: RawMeeting[] = [];
        let date: string = data[6 + 3];
        let valid: ValidFlag = 0;
        for (let i = 0; i < 4; i++) {
            const start = 6 + i * 4; // meeting information starts at index 6
            const a = data[start],
                b = data[start + 1],
                c = data[start + 2];
            if (a || b || c) {
                const meetingDate = data[start + 3];
                if (!date) date = meetingDate;
                // inconsistent date
                if (meetingDate && meetingDate !== date) valid |= 2;

                // incomplete information
                if (!a || !c || a === 'TBA' || c === 'TBA' || a === 'TBD' || c === 'TBD')
                    valid |= 1;

                // unknown meeting time
                if (!b || b === 'TBA' || b === 'TBD') {
                    valid |= 4;
                } else {
                    const [, startT, , endT] = b.split(' ');
                    // invalid meeting time
                    if (startT === endT) valid |= 4;
                }

                // insertion sort
                let k = 0;
                for (; k < meetings.length; k++) {
                    if (b < meetings[k][1]) break;
                }
                meetings.splice(k, 0, [a, b, c]);
            }
        }
        date = date || '';
        // unknown date
        if (!date || date === 'TBD' || date === 'TBA') valid |= 8;

        const tempSection: RawSection = [
            +data[0],
            data[3],
            data[23],
            STATUSES[data[24] as CourseStatus],
            +data[25],
            +data[26],
            +data[27],
            date,
            valid,
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
