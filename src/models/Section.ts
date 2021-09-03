/**
 * @author Hanzhi Zhou, Kaiying Shan
 * @module src/models
 */

/**
 *
 */
import { MeetingDate, TimeArray } from '../algorithm/ScheduleGenerator';
import { hashCode, parseTimeAll } from '../utils';
import Course, { CourseFields, Match } from './Course';
import Hashable from './Hashable';
import Meeting from './Meeting';
import { dayToInt } from './constants';
import { CourseStatus } from '../config';

/**
 * last three bits of this number correspond to the three types of invalid sections,
 * as specified by [[Section.Validity]]
 *
 * flag & 0b1 !== 0 => Section.Validity[1]
 * flag & 0b10 !== 0 => Section.Validity[2]
 * flag & 0b100 !== 0 => Section.Validity[3]
 */
export type ValidFlag = number;

type SectionMatchFields = 'topic' | 'instructors' | 'rooms';
export type SectionMatch<T extends SectionMatchFields = SectionMatchFields> = Match<T>;

/**
 * fields of the section that must be created via `Object.create`
 */
export interface SectionFields {
    /**
     * reference to the course that this section belongs to. This property is **non-enumerable**
     */
    readonly course: Course;
    /**
     * Key of the course that this section belongs to; same for all sections.
     */
    readonly key: string;
    /**
     * the id of the section, must be globally unique
     */
    readonly id: number;
    /**
     * the section number recorded in sis
     */
    readonly section: string;
    /**
     * the topic of this section, may be empty
     */
    readonly topic: string;
    /**
     * one of "Open", "Closed" and "Wait List"
     */
    readonly status: CourseStatus;
    readonly enrollment: number;
    readonly enrollment_limit: number;
    readonly wait_list: number;
    /**
     * instructor names (computed from meeting)
     */
    readonly instructors: string;
    /**
     * rooms (computed from meeting)
     */
    readonly rooms: string;
    readonly dates: string;
    readonly meetings: readonly Meeting[];

    /**
     * @see [[ValidFlag]]
     */
    readonly valid: ValidFlag;
    /**
     * @see [[MeetingDate]]
     * undefined if the meeting date is TBA/TBD or cannot be parsed
     */
    readonly dateArray?: MeetingDate;
}

// use class-interface merging
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export default interface Section extends SectionFields {}
/**
 * A section contains all the fields that a Course has,
 * and it holds additional information specific to that section.
 *
 * All section instances are immutable. Additionally, they will never be duplicated.
 * They will only be created once using `Object.create` on page load
 */
export default class Section implements CourseFields, Hashable {
    private static readonly Validity = [
        [0, 'Valid'],
        [
            1,
            `Warning: Some meetings have incomplete instructor or room information (e.g. TBA/TBD). This won't affect schedule generation.`
        ],
        [
            2,
            'Fatal: This section has several different meeting dates. Plannable currently cannot handle these type of meetings correctly'
        ],
        [
            1,
            'Warning: Some meetings have invalid (TBA/TBD) start or end time. They will not be rendered on the schedule.'
        ],
        [2, 'Fatal: This section has unknown start and end date.']
    ] as const;
    // --------- getters for fields of the course ---------------------
    get department() {
        return this.course.department;
    }
    get number() {
        return this.course.number;
    }
    get type() {
        return this.course.type;
    }
    get units() {
        return this.course.units;
    }
    get title() {
        return this.course.title;
    }
    get description() {
        return this.course.description;
    }
    /**
     * human readable name for this section, e.g. ECON 2010-001 Lecture
     */
    get displayName() {
        return `${this.department} ${this.number}-${this.section} ${this.type}`;
    }
    get displayNameNoType() {
        return `${this.department} ${this.number}-${this.section}`;
    }
    // --------- end getters for fields of the course ---------------------

    /**
     * convert [[Section.valid]] to human readable message
     */
    public get validMsg() {
        let mask = 1;
        let msg = '';
        let count = 1;
        let maxLevel = 0;
        for (let i = 1; i < Section.Validity.length; i++) {
            if (this.valid & mask) {
                const [level, msgStr] = Section.Validity[i];
                maxLevel = Math.max(maxLevel, level);
                msg += `${count++}. ${msgStr} \n`;
            }
            mask <<= 1;
        }
        return [['', 'text-warning', 'text-danger'][maxLevel], msg] as const;
    }

    public sameTimeAs(other: Section) {
        const len = this.meetings.length;
        if (len !== other.meetings.length) return false;
        return this.meetings.every((x, i) => x.days === other.meetings[i].days);
    }

    /**
     * @returns all meeting times of this section concatenated together
     * and concatenated by their dates
     */
    public combinedTime() {
        return this.meetings.reduce((acc, v) => acc + '|' + v.days, this.dates);
    }

    /**
     * @remarks The hashes of all sections of a Course by design are equal to each other.
     * @returns the hash of the Course that this section belongs to.
     */
    public hash() {
        return hashCode(this.key);
    }

    /**
     * @returns whether some meeting times of this sections are TBD
     */
    public isTBD() {
        for (const meeting of this.meetings) {
            const t = meeting.days;
            // skip empty string
            if (!t) continue;

            const [days, start, , end] = t.split(' ');
            if (!days || !start || !end) return true;
        }
        return false;
    }

    /**
     * get the time and room of this section's meetings as [[TimeArray]]
     */
    public getTimeRoom() {
        // arrays of times and rooms in each day
        const dayArray: TimeArray = [[], [], [], [], [], [], []];

        // there may be multiple meeting times. parse each of them
        const searcher = window.buildingSearcher;
        for (const meeting of this.meetings) {
            const t = meeting.days;
            // skip empty string
            if (!t) continue;

            // parse the meeting time
            const tmp1 = parseTimeAll(t);

            // skip TBA or ill-formated time
            if (tmp1 === null) return dayArray;
            const [date, timeBlock] = tmp1;

            // for each day
            for (const day of date) {
                const dayBlock = dayArray[dayToInt[day]];

                // the timeBlock is flattened
                dayBlock.push(...timeBlock);

                const [idx, rating] = searcher.findBestMatch(meeting.room);
                // we set the match threshold to 0.4
                if (rating >= 0.4) {
                    dayBlock.push(idx);
                } else {
                    // mismatch!
                    console.warn(meeting.room, 'match not found!');
                    dayBlock.push(-1);
                }
            }
        }

        return dayArray;
    }

    public has(element: Section) {
        return this === element;
    }
}
