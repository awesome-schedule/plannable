/**
 * @author Hanzhi Zhou
 * @module models
 */

/**
 * A meeting represents a specific meeting time \w information about the instructor and location
 *
 * It has a reference back to the section that it belongs to
 */
export default class Meeting {
    public static getInstructors(meetings: readonly Meeting[]) {
        const profs: string[] = [];
        for (const meeting of meetings) {
            const meetingProfs = meeting.instructor.split(', ');
            for (const prof of meetingProfs) {
                if (!profs.includes(prof)) profs.push(prof);
            }
        }
        return profs;
    }

    public readonly instructor!: string;
    public readonly days!: string;
    public readonly room!: string;
}
