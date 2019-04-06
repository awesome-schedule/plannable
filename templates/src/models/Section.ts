import Course from './Course';
import Meta, { RawSection } from './Meta';
import Meeting from './Meeting';

class Section {
    public raw: RawSection;
    public sid: number;

    public course: Course;
    public id: number;
    public section: string;
    public topic: string;
    public status: string;
    public enrollment: number;
    public enrollment_limit: number;
    public wait_list: number;
    public instructors: string[];
    public meetings: Meeting[];

    constructor(course: Course, raw: RawSection, sid: number) {
        this.course = course;
        this.raw = raw;
        this.sid = sid;

        this.id = raw[0];
        this.section = raw[1];
        this.topic = raw[2];
        this.status = Meta.STATUSES[raw[3]];
        this.enrollment = raw[4];
        this.enrollment_limit = raw[5];
        this.wait_list = raw[6];
        this.meetings = raw[7].map(x => new Meeting(this, x));
        const temp = new Set<string>();
        for (const meeting of this.meetings) {
            const insts = meeting.instructor.split(',');
            for (const inst of insts) temp.add(inst);
        }
        this.instructors = [...temp.values()];
    }

    public sameTimeAs(other: Section) {
        const len = this.meetings.length;
        if (len !== other.meetings.length) return false;
        for (let i = 0; i < len; i++) {
            if (!this.meetings[i].sameTimeAs(other.meetings[i])) return false;
        }
        return true;
    }

    public hash() {
        return this.course.hash();
    }
}

export default Section;
