/**
 * the modal module handles modal triggering
 * @author Hanzhi Zhou
 */

/**
 *
 */
import Section from '../models/Section';
import Course from '../models/Course';
import $ from 'jquery';
import 'bootstrap';

export interface ModalState {
    modalSection: Section | null;
    modalCourse: Course | null;
}

class Modal implements ModalState {
    modalSection: Section | null = null;
    modalCourse: Course | null = null;

    showSectionModal(section: Section) {
        this.modalSection = section;
        $('#section-modal').modal();
    }

    showCourseModal(course: Course) {
        this.modalCourse = course;
        $('#course-modal').modal();
    }
}

export const modal = new Modal();
export default modal;
