export interface RawCatalog {
    [key: string]: RawCourse;
}

export type RawCourse = [string, number, string, number, string, string, RawSection[]];

export type RawSection = [number, string, string, number, number, number, number, RawMeeting[]];

export type RawMeeting = [string, string, string, string];

class Meta {
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
}

export default Meta;
