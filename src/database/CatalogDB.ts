import { SemesterJSON } from '@/models/Catalog';
import { CourseFields } from '@/models/Course';
import Dexie from 'dexie';
import { SectionFields } from '../models/Section';

export interface CourseTableItem
    extends Pick<CourseFields, Exclude<keyof CourseFields, 'displayName'>> {
    ids: number[];
}

export interface SectionTableItem  // no back ref in db
    extends Pick<SectionFields, Exclude<keyof SectionFields, 'course'>> {}

export default class CatalogDB extends Dexie {
    courses: Dexie.Table<CourseTableItem, string>;
    sections: Dexie.Table<SectionTableItem, number>;
    meta: Dexie.Table<{ time: number; id: 0 }, 0>;

    constructor(semester: SemesterJSON) {
        super(`db_${semester.id}`);
        this.version(1).stores({
            courses: 'key',
            sections: 'id',
            meta: 'id'
        });
        this.courses = this.table('courses');
        this.sections = this.table('sections');
        this.meta = this.table('meta');
    }

    async empty() {
        const [a, b] = await Promise.all([this.courses.count(), this.sections.count()]);
        return a === 0 || b === 0;
    }

    async timestamp() {
        return (await this.meta.get(0))!.time;
    }

    async saveTimeStamp() {
        await this.meta.put({ id: 0, time: Date.now() });
    }
}
