/**
 * @module src/config
 */

/**
 *
 */
import axios from 'axios';
import { parse } from 'papaparse';
import { stringify } from 'querystring';
import { FastSearcher } from './algorithm/Searcher';
import Catalog, { SemesterJSON } from './models/Catalog';
import Course, { CourseFields } from './models/Course';
import Meeting, { getInstructors } from './models/Meeting';
import Section, { SectionFields, ValidFlag } from './models/Section';
import { parseDate } from './utils';
import * as defaultConfig from './config.example';

/** the version string from package.json */
export const version: string = defaultConfig.version;

/** whether running on electron */
export const runningOnElectron = defaultConfig.runningOnElectron;

/**
 * Configuration of the backend.
 */
export const backend: defaultConfig.BackendConfig = require('../package.json').backend;

/**
 * Functions for fetching data
 */
export const dataend: defaultConfig.DataEnd = {
    buildings: requestBuildingSearcher,
    distances: requestTimeMatrix,
    semesters: requestSemesterList,
    courses: requestCourses
};

/**
 * Used to generate a list of action buttons in section/course modal.
 * We used it to open external pages relevant to the given course/section.
 */
export const modalLinks: defaultConfig.ModalLinks = {
    section: [
        {
            name: 'Course Evaluations',
            action: viewEvals
        },
        {
            name: 'Grade Distribution',
            action: viewGrades
        },
        {
            name: "More Details (Lou's List)",
            action: function(semester: SemesterJSON, section: Section) {
                window.open(
                    `https://louslist.org/sectiontip.php?Semester=${semester.id}&ClassNumber=${section.id}`,
                    '_blank',
                    'width=650,height=700,scrollbars=yes'
                );
            }
        },
        {
            name: 'Reviews (Hoosmyprofessor, Chinese)',
            action: viewHpEvals
        }
    ],
    course: [
        {
            name: 'Course Evaluations',
            action: viewEvals
        },
        {
            name: 'Grade Distribution',
            action: viewGrades
        },
        {
            name: 'Reviews (Hoosmyprofessor, Chinese)',
            action: viewHpEvals
        }
    ]
};

/**
 * some default UI configurations. Usually no need to change
 */
export const ui = defaultConfig.ui;

/**
 * expiration config, usually no need to change
 */
export const semesterListExpirationTime = defaultConfig.semesterListExpirationTime; // one day
export const semesterDataExpirationTime = defaultConfig.semesterDataExpirationTime; // two hours

// -------------------------- lecture type configuration ---------------------------------
export type CourseType = defaultConfig.CourseType;
// CourseStatus is only used for typing purposes. can be just an alias of string
export type CourseStatus = defaultConfig.CourseStatus;

/**
 * lecture type number => meaning
 */
export const TYPES = defaultConfig.TYPES;

/**
 * parse lecture type string to id
 */
export const TYPES_PARSE = defaultConfig.TYPES_PARSE;
/**
 * whether to enable conversion from [[Course.key]] to human readable string.
 * It is only used to inform user about the removal of a course when its key does not exist in catalog.
 * The regex variable [[keyRegex]] will be used to match [[Course.key]]
 * @see [[Course.key]]
 */
export const enableKeyConversion = true;
/**
 * the regex used to match the components of [[Course.key]]. It must have three capture groups,
 * one for the department string, one for the course number, and one for the course type, corresponding
 * to the keys of TYPES
 */
export const keyRegex: typeof enableKeyConversion extends true
    ? RegExp
    : null = /([a-z]{1,5})([0-9]{1,5})([0-9])$/i;

// --------------------------------------------------------------------------------------------
// | The following functions are specific to plannable for University of Virginia             |
// --------------------------------------------------------------------------------------------

/**
 * for the given course, open an external webpage showing the past grades of that course
 */
function viewGrades(semester: SemesterJSON, course: CourseFields) {
    window.open(
        `https://vagrades.com/uva/${course.department.toUpperCase()}${course.number}`,
        '_blank',
        'width=650,height=700,scrollbars=yes'
    );
}

/**
 * view the evaluations for the given course
 */
function viewEvals(semester: SemesterJSON, param: CourseFields) {
    window.open(
        `https://evals.itc.virginia.edu/course-selectionguide/pages/SGMain.jsp?cmp=${param.department},${param.number}`,
        '_blank',
        'width=720,height=700,scrollbars=yes'
    );
}

function viewHpEvals(semester: SemesterJSON, param: CourseFields) {
    window.open(`https://match.msnatuva.org/courses/v2/${param.key}/`, '_blank');
}

/**
 * get the origin
 */
function getApi() {
    if (
        window.location.host.indexOf('localhost') !== -1 ||
        window.location.host.indexOf('127.0.0.1') !== -1
    ) {
        return 'http://localhost:8000'; // local development
    } else if (window.location.protocol === 'file:') {
        return `https://plannable.org/`; // electron?
    } else {
        return `${window.location.protocol}//${window.location.host}`; // other: plannable.org or plannable.gitee.io
    }
}

/**
 * request from remote and store in localStorage
 */
async function requestTimeMatrix(): Promise<Int32Array> {
    const { data } = await axios.get(`${getApi()}/data/Distance/Time_Matrix.json`);
    const len = data.length;
    const flattened = new Int32Array(len ** 2);
    for (let i = 0; i < len; i++) flattened.set(data[i], i * len);
    return flattened;
}

/**
 * request the building list from remote and store in localStorage
 *
 * @returns a building searcher
 */
async function requestBuildingSearcher() {
    const res = await axios.get<string[]>(`${getApi()}/data/Distance/Building_Array.json`);
    return new FastSearcher(res.data);
}

async function requestCourses(semester: SemesterJSON) {
    console.time(`request semester ${semester.name} data`);

    const res = await (location.host === 'plannable.org' || location.protocol === 'file:' // Running on GitHub pages or Electron (primary address)?
        ? axios.post<string>(
              'https://louslist.org/deliverData.php', // yes
              stringify({
                  Semester: semester.id,
                  Group: 'CS',
                  Description: 'Yes',
                  submit: 'Submit Data Request',
                  Extended: 'Yes'
              })
          ) // use the mirror/local dev server
        : axios.get<string>(
              `${getApi()}/data/Semester%20Data/CS${semester.id}Data.csv?time=${Math.random()}`
          ));
    console.timeEnd(`request semester ${semester.name} data`);
    return new Catalog(
        semester,
        parseSemesterData(
            parse(res.data, {
                skipEmptyLines: true,
                header: false
            }).data as string[][]
        ),
        Date.now()
    );
}

function parseSemesterData(rawData: string[][]) {
    console.time('parse semester data');

    const courseDict: { [x: string]: Course } = Object.create(null);
    const allSections: Section[] = [];
    for (let j = 1; j < rawData.length; j++) {
        const data = rawData[j];

        // todo: robust data validation
        const type = TYPES_PARSE[data[4] as CourseType];
        const key = (data[1] + data[2] + type).toLowerCase();

        const meetings: Meeting[] = [];
        let date = data[6 + 3];
        let valid: ValidFlag = 0;
        for (let i = 0; i < 4; i++) {
            const start = 6 + i * 4; // meeting information starts at index 6
            const instructor = data[start],
                days = data[start + 1],
                room = data[start + 2];
            if (instructor || days || room) {
                const meetingDate = data[start + 3];
                if (!date) date = meetingDate;
                // inconsistent date
                if (meetingDate && meetingDate !== date) valid |= 2;

                // incomplete information
                if (
                    !instructor ||
                    !room ||
                    instructor === 'TBA' ||
                    room === 'TBA' ||
                    instructor === 'TBD' ||
                    room === 'TBD'
                )
                    valid |= 1;

                // unknown meeting time
                if (!days || days === 'TBA' || days === 'TBD') {
                    valid |= 4;
                } else {
                    const [, startT, , endT] = days.split(' ');
                    // invalid meeting time
                    if (startT === endT) valid |= 4;
                }

                // insertion sort
                let k = 0;
                for (; k < meetings.length; k++) {
                    if (days < meetings[k].days) break;
                }
                meetings.splice(k, 0, {
                    instructor,
                    days,
                    room
                });
            }
        }
        // unknown date
        if (!date || date === 'TBD' || date === 'TBA') valid |= 8;
        if (typeof date !== 'string') date = '';

        let course = courseDict[key];
        if (!course) {
            course = courseDict[key] = Object.create(Course.prototype, {
                department: {
                    value: data[1],
                    enumerable: true
                },
                number: {
                    value: +data[2],
                    enumerable: true
                },
                type: {
                    value: data[4],
                    enumerable: true
                },
                key: {
                    value: key,
                    enumerable: true
                },
                units: {
                    value: data[5],
                    enumerable: true
                },
                title: {
                    value: data[22],
                    enumerable: true
                },
                description: {
                    value: data[28],
                    enumerable: true
                },
                sections: {
                    value: [] as Section[] // non-enumerable
                },
                ids: {
                    value: [] as number[],
                    enumerable: true
                }
            } as { [x in keyof Course]: TypedPropertyDescriptor<Course[x]> });
        }

        const section: Section = Object.create(Section.prototype, {
            course: {
                value: course // back ref to course, non-enumerable
            },
            key: {
                value: key,
                enumerable: true
            },
            id: {
                value: +data[0],
                enumerable: true
            },
            section: {
                value: data[3],
                enumerable: true
            },
            topic: {
                value: data[23],
                enumerable: true
            },
            status: {
                value: data[24],
                enumerable: true
            },
            enrollment: {
                value: +data[25],
                enumerable: true
            },
            enrollment_limit: {
                value: +data[26],
                enumerable: true
            },
            wait_list: {
                value: +data[27],
                enumerable: true
            },
            valid: {
                value: valid,
                enumerable: true
            },
            meetings: {
                value: meetings,
                enumerable: true
            },
            instructors: {
                value: getInstructors(meetings),
                enumerable: true
            },
            dateArray: {
                value: parseDate(date),
                enumerable: true
            },
            dates: {
                value: date,
                enumerable: true
            }
        } as {
            [x in keyof Required<SectionFields>]: TypedPropertyDescriptor<Section[x]>;
        });

        course.ids.push(+data[0]);
        course.sections.push(section);
        allSections.push(section);
    }
    const allCourses = Object.values(courseDict);
    console.timeEnd('parse semester data');

    return [courseDict, allCourses, allSections] as const;
}

/**
 * Fetch the list of semesters from Lou's list
 */
async function requestSemesterList(count = 10): Promise<SemesterJSON[]> {
    console.time('get semester list');
    const response = await (location.host === 'plannable.org' || location.protocol === 'file:'
        ? axios.get<string>(`https://louslist.org/index.php?time=${Math.random()}`)
        : axios.get<string>(`${getApi()}/data/Semester Data/index.html?time=${Math.random()}`));
    console.timeEnd('get semester list');

    const element = document.createElement('html');
    element.innerHTML = response.data;
    const options = element.getElementsByTagName('option');
    const records: SemesterJSON[] = [];
    for (let i = 0; i < Math.min(count, options.length); i++) {
        const option = options[i];
        const key = option.getAttribute('value');
        if (key) {
            const semesterId = key.substr(-4);
            const html = option.innerHTML;
            records.push({
                id: semesterId,
                name: html
                    .split(' ')
                    .splice(0, 2)
                    .join(' ')
            });
        }
    }

    return records;
}
