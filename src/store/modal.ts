import { Module, VuexModule, Mutation, getModule } from 'vuex-module-decorators';
import store from '.';
import Section from '../models/Section';
import Course from '../models/Course';

export interface ModalState {
    modalSection: Section | null;
    modalCourse: Course | null;
}

@Module({
    store,
    name: 'display',
    dynamic: true
})
class Modal extends VuexModule implements ModalState {
    modalSection: Section | null = null;
    modalCourse: Course | null = null;

    @Mutation
    showSectionModal(section: Section) {
        this.modalSection = section;
        $('#modal').modal();
    }

    @Mutation
    showCourseModal(course: Course) {
        this.modalCourse = course;
        $('#course-modal').modal();
    }
}

export const modal = getModule(Modal);
export default modal;
