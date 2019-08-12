import { CourseFields } from '@/models/Course';
import Dexie from 'dexie';
import Section, { SectionOwnPropertyNames } from '../models/Section';

export interface CourseTableItem
    extends Pick<CourseFields, Exclude<keyof CourseFields, 'displayName'>> {
    key: string;
    ids: number[];
}

export interface SectionTableItem
    extends Pick<Section, Exclude<SectionOwnPropertyNames, 'course' | 'instructors' | 'key'>> {}

export default class CatalogDB extends Dexie {
    courses: Dexie.Table<CourseTableItem, string>;
    sections: Dexie.Table<SectionTableItem, number>;

    constructor() {
        super('catalog_database');
        this.version(1).stores({
            courses: 'key',
            sections: 'id'
        });
        this.courses = this.table('courses');
        this.sections = this.table('sections');
    }
}
