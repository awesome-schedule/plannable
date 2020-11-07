/* eslint-disable import/export */
/**
 * @author Hanzhi Zhou, Kaiying Cat
 * @module models
 */

/**
 *
 */
import { MeetingDate, TimeArray } from '../algorithm/ScheduleGenerator';
import { hashCode, parseTimeAll } from '../utils';
import Course, { CourseFields, Match } from './Course';
import Hashable from './Hashable';
import Meeting from './Meeting';
import { dayToInt } from './Meta';
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

type SectionMatchFields = 'topic' | 'instructors';
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
     * array of instructor names (computed from meeting)
     */
    readonly instructors: readonly string[];
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
 * They will only created using `Object.create` on page load
 */
export default class Section implements CourseFields, Hashable {
    public static readonly Validity = [
        'Valid',
        'Warning: Some meetings have incomplete information (have TBA/TBD).',
        'Fatal: This section has several different meeting dates.',
        'Fatal: Some meetings have invalid (TBA/TBD) start or end time.',
        'Fatal: This section has unknown start and end date.'
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
    // --------- end getters for fields of the course ---------------------

    /**
     * convert [[Section.valid]] to human readable message
     */
    public get validMsg() {
        let mask = 1;
        let msg = '';
        let count = 1;
        for (let i = 1; i < Section.Validity.length; i++) {
            if (this.valid & mask) {
                msg += `${count++}. ${Section.Validity[i]} \n`;
            }
            mask <<= 1;
        }
        return msg;
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
     * get the time and room of this section's meetings as [[TimeArray]]
     */
    public getTimeRoom(): TimeArray {
        // arrays of times and rooms in each day
        const dayArray: number[][] = [[], [], [], [], [], [], []];

        // there may be multiple meeting times. parse each of them and add to tmp_dict
        const searcher = window.buildingSearcher;
        for (const meeting of this.meetings) {
            const t = meeting.days;
            // skip empty string
            if (!t) continue;

            // parse the meeting time
            const tmp1 = parseTimeAll(t);

            // skip TBA or ill-formated time
            if (tmp1 === null) return new Int16Array(8);
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

        // convert iliffe vector to array
        const timeBlocks = new Int16Array(dayArray.reduce((acc, arr) => acc + arr.length, 8));
        let count = 0;
        for (let i = 0; i < 7; i++) {
            timeBlocks[i] = count + 8;
            timeBlocks.set(dayArray[i], count + 8);
            count += dayArray[i].length;
        }
        timeBlocks[7] = timeBlocks.length;
        return timeBlocks;
    }

    public equals(sc: Section): boolean {
        if (this.key === sc.key && this.id === sc.id) {
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
    // eslint-disable-next-line
    public has(sections: Set<number>, key: string): boolean;
    // eslint-disable-next-line
    public has(element: Section | Set<number>, key?: string): boolean {
        if (element instanceof Set) return this.key === key && element.has(this.id);
        else return this.equals(element);
    }
}
