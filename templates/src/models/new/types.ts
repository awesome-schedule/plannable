// ClassNumber,Mnemonic,Number,Section,Type,Units,Instructor1,Days1,Room1,MeetingDates1,Instructor2,Days2,Room2,MeetingDates2,Instructor3,Days3,Room3,MeetingDates3,Instructor4,Days4,Room4,MeetingDates4,Title,Topic,Status,Enrollment,EnrollmentLimit,Waitlist,Description

interface Course {
    department: string;
    number: number;
    type: string;
    units: number;
    title: string;
    description: string;
    sections: Section[];
}

type CourseRaw = [string, number, string, number, string, string, SectionRaw[]];

type SectionRaw = [number, string, string, string, number, number, number, MeetingRaw[]];

type MeetingRaw = [string, string, string, string];

interface Section {
    course: Course;
    id: number;
    section: string;
    topic: string;
    status: string;
    enrollment: number;
    enrollment_limit: number;
    wait_list: number;
    meetings: Meeting[];
}

interface Meeting {
    section: Section;
    instructor: string;
    days: string;
    dates: string;
    room: string;
}
