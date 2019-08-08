import Dexie from 'dexie';
import { ValidFlag } from './Section';

interface CourseTable {
    id?: string;
    department: string;
    number: number;
    type: string;
    units: string;
    description: string;
}

interface SectionTable {
    id?: number;
    courseId: number; // foreign key
    sisId: number; // 5 digit id
    sid: string; // section id
    topic: string;
    status: number;
    enrollment: number;
    enrollment_limit: number;
    wait_list: number;
    date: string;
    valid: ValidFlag;
}

interface MeetingTable {
    id?: number;
    sectionId: number; // foreign key
    instructor: string;
    days: string;
    room: string;
}

export class CatalogDB extends Dexie {
    courses: Dexie.Table<CourseTable, string>;
    sections: Dexie.Table<SectionTable, number>;
    meetings: Dexie.Table<MeetingTable, number>;

    constructor() {
        super('CatalogDB');
        this.version(1).stores({
            courses: 'id, department, number, type, units',
            sections: '++id, courseId, sisId, sid, topic, status'
                + ' enrollment, enrollment_limit, wait_list, date, valid',
            meetings: '++id, sectionId, instructor, days, room'
        });
        this.courses = this.table('courses');
        this.sections = this.table('sections');
        this.meetings = this.table('meetings');
    }
}
