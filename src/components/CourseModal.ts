import { modal } from '../store';
import { Vue, Component } from 'vue-property-decorator';
@Component
export default class CourseModal extends Vue {
    get course() {
        return modal.modalCourse;
    }
}
