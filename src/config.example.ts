/* eslint-disable @typescript-eslint/no-use-before-define */
import { FastSearcher } from './algorithm/Searcher';
import Catalog, { SemesterJSON } from './models/Catalog';
import Course from './models/Course';
import Section from './models/Section';

/** the version string from package.json */
export const version: string = require('../package.json').version;

/** whether running on electron */
export const runningOnElectron = window.navigator.userAgent.toLowerCase().includes('electron');

export interface BackendConfig {
    /** Name of the backend */
    name: string;
    /** API endpoint for uploading/overwriting profiles on remote*/
    up: string;
    /** API endpoint for downloading profiles from remote */
    down: string;
    /** API endpoint for editing the properties of the profile (e.g. name) */
    edit: string;
    /** API endpoint for getting the authorization code */
    code: string;
    /** API endpoint to exchange authorization code for an access token */
    token: string;
    /** Client ID for OAuth */
    client_id: string;
    /** Whether to allow OAuth on plannable desktop app (built with electron) */
    oauth_on_electron: false;
    /**
     * Redirect URI for plannable desktop app. This URI will not be visited. Instead, it acts like a flag, indicating that the server
     * has directed back to the client. This can set to anything, as long as the server and the client have an agreement.
     * It is recommended to set this value to a (probably non-existent) localhost URI.
     */
    oauth_electron_redirect_uri: string;
}

export interface DataEnd {
    /**
     * an async function that fetches the array of buildings
     * @returns a FastSearcher instance constructed from the array of buildings
     */
    readonly buildings: () => Promise<FastSearcher<string>>;
    /**
     * an async function that fetches the distance matrix (equivalently, the walking time) between the buildings.
     * matrix[i * len + j] represents the distance between the ith building and jth building in the array of buildings fetched by dataend.buildings
     * @returns the distance matrix, in Int32Array
     */
    readonly distances: () => Promise<Int32Array>;
    /**
     * an async function that fetches the list of the semesters
     */
    readonly semesters: (count?: number) => Promise<SemesterJSON[]>;
    /**
     * an async function that fetches all courses corresponding to the given semester
     * @returns a catalog object built from the courses
     */
    readonly courses: (semester: SemesterJSON) => Promise<Catalog>;
}

/**
 * Functions for fetching data
 */
export const dataend: DataEnd = {
    buildings: null,
    distances: null,
    semesters: null,
    courses: null
} as any; // remove to enable type checking

interface ModalLinkItem<T> {
    /** the inner text of the button used to open your link */
    name: string;
    /**
     * an action to perform when user clicks on this link
     * @param semester the currently selected semester
     * @param param course/section corresponding to the active modal
     */
    action(semester: SemesterJSON, param: T): void;
}

export interface ModalLinks {
    section: ModalLinkItem<Section>[];
    course: ModalLinkItem<Course>[];
}

/**
 * Used to generate a list of action buttons in section/course modal.
 * We used it to open external pages relevant to the given course/section.
 */
export const modalLinks: ModalLinks = {
    section: [],
    course: []
};

/**
 * some default UI configurations. Usually no need to change
 */
export const ui = {
    sideBarWidth: 19,
    sideMargin: 3,
    tabBarWidthMobile: 10,
    tabBarWidth: 3
} as const;

/**
 * expiration config, usually no need to change
 */
export const semesterListExpirationTime = 86400 * 1000; // one day
export const semesterDataExpirationTime = 2 * 3600 * 1000; // two hours

// -------------------------- lecture type configuration ---------------------------------
export type CourseType = keyof typeof TYPES_PARSE;
// CourseStatus is only used for typing purposes. can be just an alias of string
export type CourseStatus = 'TBA' | 'Open' | 'Closed' | 'Wait List';

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
/**
 * parse lecture type string to id
 */
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

/**
 * whether to enable conversion from [[Course.key]] to human readable string.
 * It is only used to inform user about the removal of a course when its key does not exist in catalog.
 * The regex variable [[keyRegex]] will be used to match [[Course.key]]
 * @see [[Course.key]]
 */
export const enableKeyConversion = false;
/**
 * the regex used to match the components of [[Course.key]]. It must have three capture groups,
 * one for the department string, one for the course number, and one for the course type, corresponding
 * to the keys of TYPES
 */
export const keyRegex: typeof enableKeyConversion extends true ? RegExp : null = null;
