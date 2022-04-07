/**
 * @author Hanzhi Zhou
 * @module src/models
 */

/**
 * extract the array of instructor names from the array of meetings
 * @param meetings
 */
export function getCombinedMeeting(meetings: readonly Meeting[], key: 'instructor' | 'room') {
    const combined: string[] = [];
    for (const meeting of meetings) {
        for (const str of meeting[key].split(', ')) {
            if (!combined.includes(str)) combined.push(str);
        }
    }
    return combined;
}

/**
 * A meeting represents a specific meeting time \w information about the instructor and location
 */
export default interface Meeting {
    readonly instructor: string;
    readonly days: string;
    readonly room: string;
}
