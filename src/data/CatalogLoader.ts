/**
 * @module data
 * @author Hanzhi Zhou, Kaiying Shan
 * Script for loading the catalog for a given semester
 */

/**
 *
 */
import CatalogDB, { SectionTableItem } from '@/database/CatalogDB';
import Section, { SectionFields, ValidFlag } from '@/models/Section';
import axios from 'axios';
import { parse } from 'papaparse';
import { stringify } from 'querystring';
import { getApi } from '.';
import Catalog, { SemesterJSON } from '../models/Catalog';

import Course from '@/models/Course';
import Meeting, { getInstructors } from '@/models/Meeting';
import { CourseType, semesterDataExpirationTime, TYPES_PARSE } from '../models/Meta';
import { cancelablePromise, CancelablePromise, parseDate } from '../utils';

type SectionPropertyDescriptors = {
    [x in keyof SectionFields]: TypedPropertyDescriptor<Section[x]>;
};

/**
 * Try to load semester data from `localStorage`. If data expires/does not exist, fetch a fresh
 * set of data from Lou's list and save to `localStorage`.
 *
 * storage key: 1198data
 *
 * @param semester the semester to load data
 * @param force force update
 */

export async function loadSemesterData(
    semester: SemesterJSON,
    force = false
): Promise<{
    new: CancelablePromise<Catalog>;
    old?: Catalog;
}> {
    const db = new CatalogDB(semester);
    if (!(await db.empty())) {
        const time = await db.timestamp();
        if (force || Date.now() - time > semesterDataExpirationTime) {
            // send the request first, then fetch the local data
            const newData = cancelablePromise(requestSemesterData(semester, db));
            return {
                new: newData,
                old: new Catalog(semester, await retrieveFromDB(db), new Date(time).toJSON())
            };
        } else {
            return {
                new: cancelablePromise(
                    retrieveFromDB(db).then(
                        data => new Catalog(semester, data, new Date(time).toJSON())
                    )
                )
            };
        }
    } else {
        return {
            new: cancelablePromise(requestSemesterData(semester, db))
        };
    }
}

export async function requestSemesterData(semester: SemesterJSON, db?: CatalogDB) {
    console.time(`request semester ${semester.name} data`);

    const res = await (window.location.host === 'plannable.org' // Running on GitHub pages (primary address)?
        ? axios.post<string>(
              `https://rabi.phys.virginia.edu/mySIS/CS2/deliverData.php`, // yes
              stringify({
                  Semester: semester.id,
                  Group: 'CS',
                  Description: 'Yes',
                  submit: 'Submit Data Request',
                  Extended: 'Yes'
              })
          ) // use the mirror/local dev server
        : axios.get<string>(
              `${getApi()}/data/Semester%20Data/CS${semester.id}Data.csv?time=${Math.random()}`
          ));
    console.timeEnd(`request semester ${semester.name} data`);
    return new Catalog(
        semester,
        parseSemesterData(
            parse(res.data, {
                skipEmptyLines: true,
                header: false
            }).data,
            db
        ),
        new Date().toJSON()
    );
}

export function parseSemesterData(rawData: string[][], db?: CatalogDB) {
    console.time('parse semester data');

    const CLASS_TYPES = TYPES_PARSE;
    const courseDict: { [x: string]: Course } = {};

    const len = rawData.length;
    const allSections: SectionTableItem[] = [];
    for (let j = 1; j < len; j++) {
        const data = rawData[j];

        // todo: robust data validation
        const type = CLASS_TYPES[data[4] as CourseType];
        const key = (data[1] + data[2] + type).toLowerCase();

        const meetings: Meeting[] = [];
        let date = data[6 + 3];
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
                meetings.splice(k, 0, {
                    instructor,
                    days,
                    room
                });
            }
        }
        // unknown date
        if (!date || date === 'TBD' || date === 'TBA') valid |= 8;
        if (typeof date !== 'string') date = '';

        let course = courseDict[key];
        if (!course) {
            course = courseDict[key] = Object.create(Course.prototype, {
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
                    value: [] as Section[] // non-enumerable
                },
                ids: {
                    value: [] as number[],
                    enumerable: true
                }
            } as { [x in keyof Course]: TypedPropertyDescriptor<Course[x]> });
        }

        const section: Section = Object.create(Section.prototype, {
            course: {
                value: course // back ref to course, non-enumerable
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
                value: getInstructors(meetings),
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
        } as SectionPropertyDescriptors);

        course.ids.push(+data[0]);
        course.sections.push(section);
        allSections.push(section);
    }
    console.timeEnd('parse semester data');
    if (db) {
        Promise.all([db.courses.clear(), db.sections.clear()])
            .then(() => {
                console.time('save to db');
                return Promise.all([
                    db.courses.bulkAdd(Object.values(courseDict)),
                    db.sections.bulkAdd(allSections)
                ]);
            })
            .then(() => {
                db.saveTimeStamp();
                console.timeEnd('save to db');
            });
    }
    return courseDict;
}

export async function retrieveFromDB(db: CatalogDB) {
    const courseDict: { [x: string]: Course } = {};

    console.time('get courses from db');
    const [courses, secMap] = await Promise.all([
        db.courses.toArray(),
        db.sections.toArray(arr => {
            const map = new Map<number, SectionTableItem>();
            for (const item of arr) map.set(item.id, item);
            return map;
        })
    ]);
    console.timeEnd('get courses from db');

    console.time('retrieve from db');
    for (const rawCourse of courses) {
        // descriptors for this course
        const desc = Object.getOwnPropertyDescriptors(rawCourse);
        for (const key in desc) {
            desc[key].configurable = false;
            desc[key].writable = false;
        }
        const sections: Section[] = [];
        desc.sections = {
            value: sections // non-enumerable
        };
        const course: Course = Object.create(Course.prototype, desc);
        for (const id of rawCourse.ids) {
            const sec = secMap.get(id);
            if (!sec) continue;
            // descriptor for this section
            const secDesc = Object.getOwnPropertyDescriptors(sec);
            for (const key in secDesc) {
                secDesc[key].configurable = false;
                secDesc[key].writable = false;
            }
            // add missing property descriptors
            secDesc.course = {
                value: course // non-enumerable
            };
            sections.push(Object.create(Section.prototype, secDesc));
        }
        courseDict[rawCourse.key] = course;
    }
    console.timeEnd('retrieve from db');
    return courseDict;
}
