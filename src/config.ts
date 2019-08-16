import { CourseFields } from './models/Course';

export const backend = {
    name: 'Hoosmyprofessor',
    up: 'https://match.msnatuva.org/courses/api/save_plannable_profile/',
    down: 'https://match.msnatuva.org/courses/api/get_plannable_profile/',
    edit: 'https://match.msnatuva.org/courses/api/edit_plannable_profile/'
} as const;

export const external = {
    enableDetails: true,
    viewDetails(semesterId: string, courseId: number) {
        window.open(
            'https://rabi.phys.virginia.edu/mySIS/CS2/sectiontip.php?Semester=' +
                semesterId +
                '&ClassNumber=' +
                courseId,
            '_blank',
            'width=650,height=700,scrollbars=yes'
        );
    },
    enableGrades: true,
    viewGrades(course: CourseFields) {
        window.open(
            `https://vagrades.com/uva/${course.department.toUpperCase()}${course.number}`,
            '_blank',
            'width=650,height=700,scrollbars=yes'
        );
    }
} as const;

export default {
    sideBarWidth: 19,
    sideMargin: 3,
    tabBarWidthMobile: 10,
    tabBarWidth: 3,
    backend,
    external
} as const;
