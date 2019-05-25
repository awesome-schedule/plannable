import { Component, Vue, Prop } from 'vue-property-decorator';
import Course from '@/models/Course';
@Component
export default class CourseModal extends Vue {
    @Prop(Course) readonly course!: Course;
}
