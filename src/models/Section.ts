import Course, { CourseFields } from './Course';
import Meta, { RawSection } from './Meta';
import Meeting from './Meeting';
import Hashable from './Hashable';
import { TimeDict, RoomDict } from '../algorithm/ScheduleGenerator';
import { parseTimeAll } from './Utils';

/**
 * A section contains all the fields that a Course has,
 * and it holds additional information specific to that section.
 */
class Section implements CourseFields, Hashable {
    /**
     * convert a section array to a course holding the section array
     * @param sections
     */
    public static sectionsToCourse(sections: Section[]) {
        const course = sections[0].course;
        return new Course(course.raw, course.key, sections.map(x => x.sid));
    }

    public department: string;
    public number: number;
    public type: string;
    public units: string;
    public title: string;
    public description: string;

    public sid: number;
    /**
     * Key of a course; same for all sections.
     */
    public key: string;

    /**
     * a reference to the course that this section belongs to
     */
    public course: Course;
    public id: number;
    public section: string;
    public topic: string;
    /**
     * one of "Open", "Closed" and "Wait List"
     */
    public status: string;
    public enrollment: number;
    public enrollment_limit: number;
    public wait_list: number;
    public instructors: string[];
    public meetings: Meeting[];

    constructor(course: Course, raw: RawSection, sid: number) {
        this.course = course;
        this.sid = sid;
        this.key = course.key;

        this.department = course.department;
        this.number = course.number;
        this.type = course.type;
        this.units = course.units;
        this.title = course.title;
        this.description = course.description;

        this.id = raw[0];
        this.section = raw[1];
        this.topic = raw[2];
        this.status = Meta.STATUSES[raw[3]];
        this.enrollment = raw[4];
        this.enrollment_limit = raw[5];
        this.wait_list = raw[6];
        this.meetings = raw[7].map(x => new Meeting(this, x));
        const temp = new Set<string>();
        this.meetings.forEach(x => {
            x.instructor.split(',').forEach(y => temp.add(y));
        });
        this.instructors = [...temp.values()];
    }

    public sameTimeAs(other: Section) {
        const len = this.meetings.length;
        if (len !== other.meetings.length) return false;
        return this.meetings.every((x, i) => x.sameTimeAs(other.meetings[i]));
    }

    /**
     * @returns all meeting times of this section concatenated together, separated by |
     */
    public combinedTime() {
        return this.meetings.reduce((acc, v) => acc + v.days + '|', '');
    }

    /**
     * @remarks The hashes of all sections of a Course by design are equal to each other.
     * @returns the hash of the Course that this section belongs to.
     */
    public hash() {
        return this.course.hash();
    }

    public getRoomTime(): [TimeDict, RoomDict] | null {
        const timeDict: TimeDict = {};
        const roomDict: RoomDict = {};

        // there may be multiple meeting times. parse each of them and add to tmp_dict
        for (const meeting of this.meetings) {
            const t = meeting.days;
            // skip empty string
            if (!t) continue;

            // parse the meeting time
            const tmp1 = parseTimeAll(t);

            // skip TBA or ill-formated time
            if (tmp1 === null) return null;
            const [date, timeBlock] = tmp1;

            // for each day
            for (const day of date) {
                const dayBlock = timeDict[day];
                const roomBlock = roomDict[day];
                // the timeBlock is flattened
                if (dayBlock) {
                    dayBlock.push(...timeBlock);
                    (roomBlock as string[]).push(meeting.room);
                } else {
                    // copy
                    timeDict[day] = timeBlock.concat();
                    roomDict[day] = [meeting.room];
                }
            }
        }

        return [timeDict, roomDict];
    }

    public equals(sc: Section): boolean {
        if (this.key === sc.key && this.sid === sc.sid) {
            return true;
        } else {
            return false;
        }
    }

    /**
     * check whether given section is equals to this section
     */
    public has(section: Section): boolean;
    /**
     * check whether this section exists in the set of sections indices with the given key
     * @param sections
     * @param key
     */
    public has(sections: Set<number>, key: string): boolean;
    public has(element: Section | Set<number>, key?: string): boolean {
        if (element instanceof Set) return this.key === key && element.has(this.sid);
        else return this.equals(element);
    }
}

export default Section;
