/**
 * @module src/components
 */

/**
 *
 */
import { modalLinks } from '@/config';
import { SearchMatch, SemesterJSON } from '@/models/Catalog';
import Course from '@/models/Course';
import { Component, Prop, Vue } from 'vue-property-decorator';
/**
 * component for displaying detailed information of a Course along with all sections contained in it
 * @author Kaiying Shan, Hanzhi Zhou
 * @noInheritDoc
 */
@Component
export default class CourseModal extends Vue {
    get links() {
        return modalLinks.course;
    }
    @Prop(Course) readonly course!: Course;
    @Prop({ type: Array, default: [] }) readonly match!: SearchMatch;
    @Prop(Object) readonly semester!: SemesterJSON;
}
