/**
 * @module data
 * @author Hanzhi Zhou, Kaiying Shan
 * Script for loading the catalog for a given semester
 */

/**
 *
 */
import Course, { CourseFields } from '@/models/Course';
import Meeting from '@/models/Meeting';
import Section, { ValidFlag } from '@/models/Section';
import { parseDate } from '@/utils';
import axios from 'axios';
import { parse } from 'papaparse';
import { stringify } from 'querystring';
import { getApi } from '.';
import Catalog, { CatalogJSON, SemesterJSON } from '../models/Catalog';
import { CourseType, semesterDataExpirationTime, TYPES_PARSE } from '../models/Meta';
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

export function parseSemesterData(csv_string: string) {
    const CLASS_TYPES = TYPES_PARSE;
    console.time('parsing csv');
    const raw_data: string[][] = parse(csv_string, {
        skipEmptyLines: true,
        header: false
    }).data;
    console.timeEnd('parsing csv');
    console.time('reorganizing data');

    const rawCatalog: { [x: string]: Course } = Object.create(null);
    const len = raw_data.length;
    for (let j = 1; j < len; j++) {
        const data = raw_data[j];

        // todo: robust data validation
        const type = CLASS_TYPES[data[4] as CourseType];
        const key = (data[1] + data[2] + type).toLowerCase();
        const meetings: Meeting[] = [];
        let date: string = data[6 + 3];
        let valid: ValidFlag = 0;
        for (let i = 0; i < 4; i++) {
            const start = 6 + i * 4; // meeting information starts at index 6
            const instructor = data[start],
                days = data[start + 1],
                room = data[start + 2];
            if (instructor || days || room) {
                const meetingDate = data[start + 3];
                if (!date) date = meetingDate;
                // inconsistent date
                if (meetingDate && meetingDate !== date) valid |= 2;

                // incomplete information
                if (
                    !instructor ||
                    !room ||
                    instructor === 'TBA' ||
                    room === 'TBA' ||
                    instructor === 'TBD' ||
                    room === 'TBD'
                )
                    valid |= 1;

                // unknown meeting time
                if (!days || days === 'TBA' || days === 'TBD') {
                    valid |= 4;
                } else {
                    const [, startT, , endT] = days.split(' ');
                    // invalid meeting time
                    if (startT === endT) valid |= 4;
                }

                // insertion sort
                let k = 0;
                for (; k < meetings.length; k++) {
                    if (days < meetings[k].days) break;
                }
                meetings.splice(
                    k,
                    0,
                    Object.create(Meeting.prototype, {
                        instructor: {
                            value: instructor,
                            enumerable: true
                        },
                        days: {
                            value: days,
                            enumerable: true
                        },
                        room: {
                            value: room,
                            enumerable: true
                        }
                    } as { [x in keyof Meeting]: TypedPropertyDescriptor<Meeting[x]> })
                );
            }
        }
        // unknown date
        if (!date || date === 'TBD' || date === 'TBA') valid |= 8;
        if (typeof date !== 'string') date = '';

        const course =
            rawCatalog[key] ||
            (rawCatalog[key] = Object.create(Course.prototype, {
                department: {
                    value: data[1],
                    enumerable: true
                },
                number: {
                    value: +data[2],
                    enumerable: true
                },
                type: {
                    value: data[4],
                    enumerable: true
                },
                key: {
                    value: key,
                    enumerable: true
                },
                units: {
                    value: data[5],
                    enumerable: true
                },
                title: {
                    value: data[22],
                    enumerable: true
                },
                description: {
                    value: data[28],
                    enumerable: true
                },
                sections: {
                    value: [] as Section[],
                    enumerable: true
                }
            } as { [x in keyof Course]: TypedPropertyDescriptor<Course[x]> }));
        course.sections.push(
            Object.create(Section.prototype, {
                course: {
                    value: course, // back ref to course
                    enumerable: true
                },
                key: {
                    value: key,
                    enumerable: true
                },
                id: {
                    value: +data[0],
                    enumerable: true
                },
                section: {
                    value: data[3],
                    enumerable: true
                },
                topic: {
                    value: data[23],
                    enumerable: true
                },
                status: {
                    value: data[24],
                    enumerable: true
                },
                enrollment: {
                    value: +data[25],
                    enumerable: true
                },
                enrollment_limit: {
                    value: +data[26],
                    enumerable: true
                },
                wait_list: {
                    value: +data[27],
                    enumerable: true
                },
                valid: {
                    value: valid,
                    enumerable: true
                },
                meetings: {
                    value: meetings,
                    enumerable: true
                },
                instructors: {
                    value: Meeting.getInstructors(meetings),
                    enumerable: true
                },
                dateArray: {
                    value: parseDate(date),
                    enumerable: true
                },
                dates: {
                    value: date,
                    enumerable: true
                }
                // tslint:disable-next-line: max-line-length
            } as { [x in Exclude<NonFunctionPropertyNames<Section>, undefined | keyof CourseFields | 'validMsg'>]: TypedPropertyDescriptor<Section[x]> })
        );
    }

    console.timeEnd('reorganizing data');
    return rawCatalog;
}
