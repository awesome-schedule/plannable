/**
 * @module components
 */

/**
 *
 */
import config from '@/config';
import { SearchMatch } from '@/models/Catalog';
import Course from '@/models/Course';
import { Component, Prop, Vue } from 'vue-property-decorator';
/**
 * component for displaying detailed information of a Course along with all sections contained in it
 * @author Kaiying Shan, Hanzhi Zhou
 * @noInheritDoc
 */
@Component
export default class CourseModal extends Vue {
    get config() {
        return config.external;
    }
    @Prop(Course) readonly course!: Course;
    @Prop({ type: Array, default: [] }) readonly match!: SearchMatch;
}
