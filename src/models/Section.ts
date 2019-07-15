/**
 * @author Hanzhi Zhou
 * @module models
 */

/**
 *
 */
import { TimeArray } from '../algorithm';
import { hashCode, parseTimeAll } from '../utils';
import Course, { CourseFields, Match } from './Course';
import { findBestMatch } from 'string-similarity';
import Hashable from './Hashable';
import Meeting from './Meeting';
import { STATUSES, dayToInt, CourseStatus } from './Meta';

type SectionMatchFields = 'topic' | 'instructors';
export type SectionMatch<T extends SectionMatchFields = SectionMatchFields> = Match<T>;

/**
 * A section contains all the fields that a Course has,
 * and it holds additional information specific to that section.
 *
 * All section instances are immutable
 */
export default class Section implements CourseFields, Hashable {
    public readonly department: string;
    public readonly number: number;
    public readonly type: string;
    public readonly units: string;
    public readonly title: string;
    public readonly description: string;

    /**
     * Key of the course that this section belongs to; same for all sections.
     */
    public readonly key: string;
    /**
     * the id of the section recorded in sis
     */
    public readonly id: number;
    /**
     * the section number recorded in sis
     */
    public readonly section: string;
    public readonly topic: string;
    /**
     * one of "Open", "Closed" and "Wait List"
     */
    public readonly status: CourseStatus;
    public readonly enrollment: number;
    public readonly enrollment_limit: number;
    public readonly wait_list: number;
    public readonly instructors: ReadonlyArray<string>;
    public readonly meetings: ReadonlyArray<Meeting>;
    public readonly hasIncompleteMeetings: boolean;
    /**
     * @param course a reference to the course that this section belongs to
     * @param sid the index of the section
     */
    constructor(
        course: Course,
        public readonly sid: number,
        public readonly matches: ReadonlyArray<SectionMatch> = []
    ) {
        this.key = course.key;

        this.department = course.department;
        this.number = course.number;
        this.type = course.type;
        this.units = course.units;
        this.title = course.title;
        this.description = course.description;

        const raw = course.raw[6][sid];
        this.id = raw[0];
        this.section = raw[1];
        this.topic = raw[2];
        this.status = STATUSES[raw[3]];
        this.enrollment = raw[4];
        this.enrollment_limit = raw[5];
        this.wait_list = raw[6];
        this.meetings = raw[7].map(x => new Meeting(x));
        this.instructors = Meeting.getInstructors(raw[7]);
        this.hasIncompleteMeetings = this.meetings.some(m => m.incomplete);
    }

    public get displayName() {
        return `${this.department} ${this.number}-${this.section} ${this.type}`;
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
     * @returns all meeting times of this section concatenated together (separated by |)
     * and concatenated by their dates
     */
    public combinedTimeAndDate() {
        return this.combinedTime() + ' ' + this.meetings[0].dates;
    }

    /**
     * @remarks The hashes of all sections of a Course by design are equal to each other.
     * @returns the hash of the Course that this section belongs to.
     */
    public hash() {
        return hashCode(this.key);
    }

    /**
     * get the time and room of this section's meetings as [[TimeArray]]
     */
    public getTimeRoom(): TimeArray | null {
        const timeDict: TimeArray = [[], [], [], [], []];

        // there may be multiple meeting times. parse each of them and add to tmp_dict
        const buildingList = window.buildingList;
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
                const d = dayToInt[day];
                const dayBlock = timeDict[d];
                // the timeBlock is flattened

                dayBlock.push(...timeBlock);

                const { room } = meeting;
                const roomMatch = findBestMatch(room.toLowerCase(), buildingList as string[]);
                // we set the match threshold to 0.4
                if (roomMatch.bestMatch.rating >= 0.4) {
                    dayBlock.push(roomMatch.bestMatchIndex);
                } else {
                    // mismatch!
                    console.warn(room, 'match not found!');
                    dayBlock.push(-1);
                }
            }
        }

        return timeDict;
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

    /**
     * returns an array that represents the date and month of the section's
     * start and end day
     * Example:
     * ```js
     * [[8, 26], [12, 26]]
     * ```
     */
    public getDateArray() {
        return this.meetings[0].dates.split(' - ').
            map(x => x.split('/').splice(0, 2).
                map(a => parseInt(a)));
    }
}
