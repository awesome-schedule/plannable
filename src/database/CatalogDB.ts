import { CourseFields } from '@/models/Course';
import Dexie from 'dexie';
import Section, { SectionOwnPropertyNames, ValidFlag } from '../models/Section';

export interface CourseTableItem extends CourseFields {
    key: string;
    ids: number[];
}

export interface SectionTableItem
    extends Pick<Section, Exclude<SectionOwnPropertyNames, 'course' | 'instructors'>> {}
type a = keyof SectionTableItem;
export default class CatalogDB extends Dexie {
    courses: Dexie.Table<CourseTableItem, string>;
    sections: Dexie.Table<SectionTableItem, number>;
    // meetings: Dexie.Table<MeetingTableItem, number>;

    constructor() {
        super('catalog_database');
        this.version(1).stores({
            courses: 'key, department, number, type, units, title, description, sections',
            sections:
                'id, topic, status,' +
                ' enrollment, enrollment_limit, wait_list, dates, valid, meetings'
        });
        this.courses = this.table('courses');
        this.sections = this.table('sections');
        // this.meetings = this.table('meetings');
    }
}
