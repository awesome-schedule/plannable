/**
 * Meta stores some constants and type definitions
 * @author Hanzhi Zhou
 * @module models
 */

/**
 *
 */
export type CourseType = keyof typeof TYPES_PARSE;

export type CourseStatus = 'TBA' | 'Open' | 'Closed' | 'Wait List';

export type Day = 'Mo' | 'Tu' | 'We' | 'Th' | 'Fr' | 'Sa' | 'Su';

export const dayToInt = Object.freeze({
    Mo: 0,
    Tu: 1,
    We: 2,
    Th: 3,
    Fr: 4,
    Sa: 5,
    Su: 6
});

export const DAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'] as const;
/**
 * lecture type number => meaning
 */
export const TYPES = Object.freeze({
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

export const TYPES_PARSE = Object.freeze({
    '': -1,
    Clinical: 0,
    CLN: 0,
    Discussion: 1,
    DIS: 1,
    Drill: 2,
    DRL: 2,
    'Independent Study': 3,
    IND: 3,
    Laboratory: 4,
    LAB: 4,
    Lecture: 5,
    LEC: 5,
    Practicum: 6,
    PRA: 6,
    Seminar: 7,
    SEM: 7,
    Studio: 8,
    STO: 8,
    Workshop: 9,
    WKS: 9
});

export const semesterListExpirationTime = 86400 * 1000; // one day
export const semesterDataExpirationTime = 2 * 3600 * 1000; // two hours
