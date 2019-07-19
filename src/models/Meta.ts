import { ValidFlag } from './Section';

/**
 * Meta stores some constants and type definitions
 * @author Hanzhi Zhou
 * @module models
 */

/**
 * the raw catalog is represented as a big dictionary
 *
 * key: department + number + type, e.g. cs11105
 *
 * value: raw record of the dictionary
 */
export interface RawCatalog {
    [key: string]: RawCourse;
}

export type CourseType =
    | 'Clinical'
    | 'Discussion'
    | 'Drill'
    | 'Independent Study'
    | 'Laboratory'
    | 'Lecture'
    | 'Practicum'
    | 'Seminar'
    | 'Studio'
    | 'Workshop'
    | '';

export type CourseStatus = 'TBA' | 'Open' | 'Closed' | 'Wait List';

/**
 * 0: department
 *
 * 1: number
 *
 * 2: type: 0 to 9. Use [[Meta.TYPES_PARSE]] to convert `Lecture` like string to number
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
 * 3: status Use [[Meta.STATUSES_PARSE]] to parse string to number
 *
 * 4: enrollment
 *
 * 5: enrollment limit
 *
 * 6: wait_list
 *
 * 7: date
 *
 * 8: valid
 *
 * 9: meetings
 */
export type RawSection = [
    number,
    string,
    string,
    number,
    number,
    number,
    number,
    string,
    ValidFlag,
    RawMeeting[]
];

/**
 * 0: instructor
 *
 * 1: days
 *
 * 2: room
 */
export type RawMeeting = [string, string, string];

export type Day = 'Mo' | 'Tu' | 'We' | 'Th' | 'Fr' | 'Sa' | 'Su';

/**
 * The generic iliffe vector used to store some information about each day within a week
 */
export type Week<T> = [T[], T[], T[], T[], T[], T[], T[]];

export const dayToInt = Object.freeze({
    Mo: 0,
    Tu: 1,
    We: 2,
    Th: 3,
    Fr: 4,
    Sa: 5,
    Su: 6
}) as { readonly [key in Day]: number };

export const DAYS: ReadonlyArray<Day> = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
/**
 * lecture type number => meaning
 */
export const TYPES: { [x: number]: CourseType } = Object.freeze({
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
}) as { [x: number]: CourseType };

/**
 * status number => meaning
 */
export const STATUSES = Object.freeze({
    '-1': 'TBA',
    1: 'Open',
    0: 'Closed',
    2: 'Wait List'
}) as { [x: number]: CourseStatus };

export const TYPES_PARSE: { readonly [x in CourseType]: number } = Object.freeze({
    '': -1,
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

export const STATUSES_PARSE: { readonly [x in CourseStatus]: number } = Object.freeze({
    Open: 1,
    Closed: 0,
    'Wait List': 2,
    TBA: -1
});

export const semesterListExpirationTime = 86400 * 1000; // one day
export const semesterDataExpirationTime = 2 * 3600 * 1000; // two hours
