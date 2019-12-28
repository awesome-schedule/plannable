import { FastSearcher } from './algorithm/Searcher';
import Catalog, { SemesterJSON } from './models/Catalog';
import { CourseFields } from './models/Course';

/**
 * Configuration of the backend. Not recommended to use anymore due to some security concerns
 */
export const backend = {
    /**
     * Name of the backend
     */
    name: '',
    /**
     * API endpoint for uploading/overwriting profiles on remote
     */
    up: '',
    /**
     * API endpoint for downloading profiles from remote
     */
    down: '',
    /**
     * API endpoint for editing the properties of the profile (e.g. name)
     */
    edit: ''
} as const;

/**
 * Functions for fetching data
 */
export const dataend: {
    readonly buildings: () => Promise<FastSearcher>;
    readonly distances: () => Promise<Int32Array>;
    readonly semesters: (count?: number) => Promise<SemesterJSON[]>;
    readonly courses: (semester: SemesterJSON) => Promise<Catalog>;
} = {
    /**
     * an async function that fetches the array of buildings
     * @returns a FastSearcher instance constructed from the array of buildings
     */
    buildings: null,
    /**
     * an async function that fetches the distance matrix (equivalently, the walking time) between the buildings.
     * matrix[i * len + j] represents the distance between the ith building and jth building in the array of buildings fetched by dataend.buildings
     * @returns the distance matrix, in Int32Array
     */
    distances: null,
    /**
     * an async function that fetches the list of the semesters
     */
    semesters: null,
    /**
     * an async function that fetches all courses corresponding to the given semester
     * @returns a catalog object built from the courses
     */
    courses: null
} as any; // remove to enable type checking

/**
 * functions for opening external webpages
 */
export const external = {
    enableDetails: false,
    /**
     * for the given semester id and section id, open an external webpage showing the detail of that section
     */
    viewDetails(semesterId: string, secId: number) {},
    enableGrades: false,
    /**
     * for the given course, open an external webpage showing the past grades of that course
     */
    viewGrades(course: CourseFields) {}
} as const;

/**
 * some default UI configurations. Usually no need to change
 */
export default {
    sideBarWidth: 19,
    sideMargin: 3,
    tabBarWidthMobile: 10,
    tabBarWidth: 3
} as const;
