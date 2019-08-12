/**
 * @module data
 * @author Hanzhi Zhou, Kaiying Shan
 * Script for loading the catalog for a given semester
 */

/**
 *
 */
import CatalogDB, { CourseTableItem, SectionTableItem } from '@/database/CatalogDB';
import Section, { SectionOwnPropertyNames, ValidFlag } from '@/models/Section';
import axios from 'axios';
import { parse } from 'papaparse';
import { stringify } from 'querystring';
import { getApi } from '.';
import Catalog, { SemesterJSON } from '../models/Catalog';

import Course from '@/models/Course';
import Meeting from '@/models/Meeting';
import { CourseType, RawCatalog, semesterDataExpirationTime, TYPES_PARSE } from '../models/Meta';
import { cancelablePromise, CancelablePromise, errToStr, parseDate, timeout } from '../utils';

type SectionPropertyDescriptors = {
    [x in SectionOwnPropertyNames]: TypedPropertyDescriptor<Section[x]>
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
    const time = localStorage.getItem('idb_time');
    const semesterId = localStorage.getItem('idb_semester');
    const db = new CatalogDB();
    if (time && semesterId) {
        const old = new Catalog(semester, await retrieveFromDB(db), new Date(+time).toJSON());
        if (force || new Date().getTime() - +time > semesterDataExpirationTime) {
            return {
                new: cancelablePromise(requestSemesterData(semester, new CatalogDB())),
                old
            };
        } else {
            return {
                new: cancelablePromise(Promise.resolve(old))
            };
        }
    } else {
        return {
            new: cancelablePromise(requestSemesterData(semester, new CatalogDB()))
        };
    }
}

export async function requestSemesterData(semester: SemesterJSON, db: CatalogDB) {
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
    const rawCatalog = parseSemesterData(data, db, semester);
    return new Catalog(semester, rawCatalog, new Date().toJSON());
}

export function parseSemesterData(
    raw_data: string[][],
    db: CatalogDB,
    currentSemester: SemesterJSON
) {
    console.time('parse semester data and store');
    const CLASS_TYPES = TYPES_PARSE;
    const rawCatalog: { [x: string]: Course } = {};

    const len = raw_data.length;
    const sectionArr: SectionTableItem[] = [];
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
                const meeting: Meeting = Object.create(Meeting.prototype, {
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
                } as { [x in keyof Meeting]: TypedPropertyDescriptor<Meeting[x]> });

                meetings.splice(k, 0, meeting);
            }
        }
        date = date || '';
        // unknown date
        if (!date || date === 'TBD' || date === 'TBA') valid |= 8;

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
                },
                ids: {
                    value: [] as number[],
                    enumerable: true
                }
            } as { [x in keyof Course]: TypedPropertyDescriptor<Course[x]> }));

        const section: Section = Object.create(Section.prototype, {
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
        } as SectionPropertyDescriptors);

        course.ids.push(+data[0]);
        course.sections.push(section);
        const { course: _, ...others } = section;
        sectionArr.push(others);
    }
    Promise.all([db.courses.clear(), db.sections.clear()])
        .then(() => {
            console.time('save to db');
            Promise.all([
                db.courses.bulkAdd(
                    Object.values(rawCatalog).map(course => {
                        const { sections, ...others } = course;
                        return others;
                    })
                ),
                db.sections.bulkAdd(sectionArr)
            ]);
        })
        .then(() => {
            localStorage.setItem('idb_time', new Date().getTime().toString());
            localStorage.setItem('idb_semester', currentSemester.id);
            console.timeEnd('save to db');
        });
    console.timeEnd('parse semester data and store');
    return rawCatalog;
}

export async function retrieveFromDB(db: CatalogDB) {
    const rawCatalog: { [x: string]: Course } = {};

    console.time('get courses from db');
    const secMap: Map<number, SectionTableItem> = new Map();
    const [courses] = await Promise.all([
        db.courses.toArray(),
        db.sections.toArray(arr => {
            for (const item of arr) {
                secMap.set(item.id, item);
            }
            return arr;
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
            value: sections,
            enumerable: true
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
            const meetings: Meeting[] = secDesc.meetings.value!.map(m =>
                Object.create(Meeting.prototype, Object.getOwnPropertyDescriptors(m))
            );
            secDesc.meetings.value = meetings;
            // add missing property descriptors
            secDesc.course = {
                value: course,
                enumerable: true
            };
            sections.push(Object.create(Section.prototype, secDesc));
        }
        rawCatalog[rawCourse.key] = course;
    }
    console.timeEnd('retrieve from db');
    return rawCatalog;
}
