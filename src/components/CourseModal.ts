/**
 * @module components
 */
import { Component, Vue, Prop } from 'vue-property-decorator';
import Course from '@/models/Course';
import Section from '@/models/Section';

/**
 * component for displaying detailed information of a Course along with all sections contained in it
 * @author Kaiying Shan, Hanzhi Zhou
 */
@Component
export default class CourseModal extends Vue {
    @Prop(Course) readonly course!: Course;

    // dates(section: Section) {
    //     return section.meetings.reduce((acc: string[], x, i) => {
    //         if (i > 0) {
    //             acc.push(x.dates === acc[i - 1] ? '' : x.dates);
    //         } else {
    //             acc.push(x.dates);
    //         }
    //         return acc;
    //     }, []);
    // }
}
