/**
 * @module store
 * @author Hanzhi Zhou
 */

/**
 *
 */
import Section from '../models/Section';
import Course from '../models/Course';
import $ from 'jquery';
import 'bootstrap';

/**
 * the modal module handles modal triggering
 */
class Modal {
    section: Section | null = null;
    course: Course | null = null;
    url: string = '';

    showSectionModal(section: Section) {
        this.section = section;
        $('#section-modal').modal();
    }

    showCourseModal(course: Course) {
        this.course = course;
        $('#course-modal').modal();
    }

    showURLModal(url: string) {
        this.url = url;
        $('#url-modal').modal();
    }
}

export const modal = new Modal();
export default modal;
