/**
 * @author Hanzhi Zhou
 * @module src/models
 */

/**
 * extract the array of instructor names from the array of meetings
 * @param meetings
 */
export function getInstructors(meetings: readonly Meeting[]) {
    const profs: string[] = [];
    for (const meeting of meetings) {
        const meetingProfs = meeting.instructor.split(', ');
        for (const prof of meetingProfs) {
            if (!profs.includes(prof)) profs.push(prof);
        }
    }
    return profs;
}

/**
 * A meeting represents a specific meeting time \w information about the instructor and location
 */
export default interface Meeting {
    readonly instructor: string;
    readonly days: string;
    readonly room: string;
}
