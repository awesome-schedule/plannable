/**
 * @module components
 */
import { Component, Vue, Prop } from 'vue-property-decorator';
import Course from '@/models/Course';

/**
 * component for displaying detailed information of a Course along with all sections contained in it
 * @author Kaiying Shan, Hanzhi Zhou
 */
@Component
export default class CourseModal extends Vue {
    @Prop(Course) readonly course!: Course;
}
