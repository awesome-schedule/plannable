/**
 * @module data
 * @author Hanzhi Zhou, Kaiying Shan
 * Script for loading the catalog for a given semester
 */

/**
 *
 */
import CatalogDB, { SectionTableItem } from '@/database/CatalogDB';
import Section from '@/models/Section';
import Catalog, { SemesterJSON } from '../models/Catalog';

import Course from '@/models/Course';
import { cancelablePromise, CancelablePromise } from '../utils';
import { dataend, semesterDataExpirationTime } from '@/config';

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
            const newData = cancelablePromise(
                dataend.courses(semester).then(catalog => saveToDB(catalog, db))
            );
            return {
                new: newData,
                old: new Catalog(semester, await retrieveFromDB(db), time)
            };
        } else {
            return {
                new: cancelablePromise(
                    retrieveFromDB(db).then(data => new Catalog(semester, data, time))
                )
            };
        }
    } else {
        return {
            new: cancelablePromise(dataend.courses(semester).then(catalog => saveToDB(catalog, db)))
        };
    }
}

function saveToDB(catalog: Catalog, db: CatalogDB) {
    Promise.all([db.courses.clear(), db.sections.clear()])
        .then(() => {
            console.time('save to db');
            return Promise.all([
                db.courses.bulkAdd(catalog['courses'] as any),
                db.sections.bulkAdd(catalog['sections'] as any)
            ]);
        })
        .then(() => {
            db.saveTimeStamp();
            console.timeEnd('save to db');
        });
    return catalog;
}

async function retrieveFromDB(db: CatalogDB) {
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
    const allSections: Section[] = [];
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
            const section = Object.create(Section.prototype, secDesc);
            sections.push(section);
            allSections.push(section);
        }
        courseDict[rawCourse.key] = course;
    }
    console.timeEnd('retrieve from db');
    return [courseDict, Object.values(courseDict), allSections] as const;
}
