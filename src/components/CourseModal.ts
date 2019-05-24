import Store from '../store';
import { Component } from 'vue-property-decorator';
@Component
export default class CourseModal extends Store {
    get course() {
        return this.modal.modalCourse;
    }
}
