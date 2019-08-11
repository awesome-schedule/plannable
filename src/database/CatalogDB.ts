import Dexie from 'dexie';
import { ValidFlag } from '../models/Section';

export interface CourseTableItem {
    id?: string;
    department: string;
    number: number;
    type: number;
    units: string;
    title: string;
    description: string;
    sections: number[];
}

export interface SectionTableItem {
    id?: number; // 5 digit sis id
    sid: string; // section id
    topic: string;
    status: number;
    enrollment: number;
    enrollment_limit: number;
    wait_list: number;
    date: string;
    valid: ValidFlag;
    meetings: number[];
}

export interface MeetingTableItem {
    id?: number;
    instructor: string;
    days: string;
    room: string;
}

export default class CatalogDB extends Dexie {
    courses: Dexie.Table<CourseTableItem, string>;
    sections: Dexie.Table<SectionTableItem, number>;
    meetings: Dexie.Table<MeetingTableItem, number>;

    constructor() {
        super('catalog_database');
        this.version(1).stores({
            courses: 'id, department, number, type, units, title, description, sections',
            sections: 'id, sid, topic, status,'
                + ' enrollment, enrollment_limit, wait_list, date, valid, meetings',
            meetings: '++id, instructor, days, room'
        });
        this.courses = this.table('courses');
        this.sections = this.table('sections');
        this.meetings = this.table('meetings');
    }
}
