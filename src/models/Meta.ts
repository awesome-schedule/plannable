/**
 * Meta stores some constants and type definitions
 * @author Hanzhi Zhou
 * @see [[Meta]]
 */

/**
 *
 */
import Schedule from './Schedule';
import ScheduleEvaluator from '../algorithm/ScheduleEvaluator';

/**
 * key: department + number + type, e.g. cs11105
 */
export interface RawCatalog {
    [key: string]: RawCourse;
}

/**
 * 0: department
 *
 * 1: number
 *
 * 2: type: 0 to 9. Use Meta.TYPES_PARSE to convert to string like `Lecture`
 *
 * 3: units
 *
 * 4: title
 *
 * 5: description
 *
 * 6: RawSection[]
 */
export type RawCourse = [string, number, number, string, string, string, RawSection[]];

/**
 * 0: id
 *
 * 1: section
 *
 * 2: topic
 *
 * 3: status Use Meta.STATUSES_PARSE to do parsing
 *
 * 4: enrollment
 *
 * 5: enrollment limit
 *
 * 6: wait_list
 *
 * 7: meetings
 */
export type RawSection = [number, string, string, number, number, number, number, RawMeeting[]];

/**
 * 0: instructor
 *
 * 1: days
 *
 * 2: room
 *
 * 3: dates
 */
export type RawMeeting = [string, string, string, string];

class Meta {
    public static readonly days = ['Mo', 'Tu', 'We', 'Th', 'Fr'];
    /**
     * lecture type number => meaning
     */
    public static readonly TYPES: { [x: number]: string } = Object.freeze({
        '-1': '',
        0: 'Clinical',
        1: 'Discussion',
        2: 'Drill',
        3: 'Independent Study',
        4: 'Laboratory',
        5: 'Lecture',
        6: 'Practicum',
        7: 'Seminar',
        8: 'Studio',
        9: 'Workshop'
    });

    /**
     * status number => meaning
     */
    public static readonly STATUSES: { [x: number]: string } = Object.freeze({
        '-1': 'TBA',
        1: 'Open',
        0: 'Closed',
        2: 'Wait List'
    });

    // maybe do this using enum?
    public static readonly TYPES_PARSE: { [x: string]: number } = Object.freeze({
        Clinical: 0,
        Discussion: 1,
        Drill: 2,
        'Independent Study': 3,
        Laboratory: 4,
        Lecture: 5,
        Practicum: 6,
        Seminar: 7,
        Studio: 8,
        Workshop: 9
    });

    public static readonly STATUSES_PARSE: { [x: string]: number } = Object.freeze({
        Open: 1,
        Closed: 0,
        'Wait List': 2
    });

    public static readonly storageVersion = 2;

    public static readonly storageFields = [
        // schedules
        'currentSemester', // note: this field is for uploadJSON

        'currentScheduleIndex',
        'currentSchedule',
        'proposedSchedules',
        'proposedScheduleIndex',
        'cpIndex',

        // filters
        'allowWaitList',
        'allowClosed',
        'sortOptions',
        'timeSlots',
        'combineSections',

        // settings
        'showTime',
        'showRoom',
        'showInstructor',
        'showClasslistTitle',
        'fullHeight',
        'partialHeight',
        'earliest',
        'latest',
        'standard',
        'multiSelect'
    ];

    public static readonly semesterListExpirationTime = 86400 * 1000; // one day
    public static readonly semesterDataExpirationTime = 2 * 3600 * 1000; // two hours
}

export default Meta;

/**
 * use a standalone method to get rid of deep copy issues
 */
export function getDefaultData() {
    return {
        semesters: [],
        currentSemester: null,
        currentScheduleIndex: 0,
        currentSchedule: new Schedule(),
        proposedSchedules: [new Schedule()],
        proposedScheduleIndex: 0,
        cpIndex: -1,

        // display options
        showTime: false,
        showRoom: true,
        showInstructor: true,
        showClasslistTitle: false,
        fullHeight: 40,
        partialHeight: 25,
        earliest: '08:00:00',
        latest: '19:00:00',
        standard: false,
        multiSelect: true,

        // filter options
        timeSlots: [],
        allowWaitlist: true,
        allowClosed: true,
        sortOptions: ScheduleEvaluator.getDefaultOptions(),
        combineSections: true
    } as { [x: string]: any };
}
