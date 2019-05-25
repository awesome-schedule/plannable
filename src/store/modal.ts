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
    section: Section | null;
    course: Course | null;
}

class Modal implements ModalState {
    section: Section | null = null;
    course: Course | null = null;

    showSectionModal(section: Section) {
        this.section = section;
        $('#section-modal').modal();
    }

    showCourseModal(course: Course) {
        this.course = course;
        $('#course-modal').modal();
    }
}

export const modal = new Modal();
export default modal;
