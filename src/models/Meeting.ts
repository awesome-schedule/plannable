/**
 * @author Hanzhi Zhou
 * @module models
 */

/**
 *
 */
import { RawMeeting } from './Meta';
import Section from './Section';

/**
 * A meeting represents a specific meeting time \w information about the instructor and location
 *
 * It has a reference back to the section that it belongs to
 */
export default class Meeting {
    public static getInstructors(meetings: RawMeeting[]) {
        const profs: string[] = [];
        for (const meeting of meetings) {
            const meetingProfs = meeting[0].split(', ');
            for (const prof of meetingProfs) {
                if (!profs.includes(prof)) profs.push(prof);
            }
        }
        return profs;
    }
    public readonly section: Section;
    public readonly instructor: string;
    public readonly days: string;
    public readonly dates: string;
    public readonly room: string;
    constructor(section: Section, raw: RawMeeting) {
        this.section = section;
        this.instructor = raw[0];
        this.days = raw[1];
        this.room = raw[2];
        this.dates = raw[3];
    }

    public sameTimeAs(other: Meeting) {
        return this.days === other.days;
    }
}
