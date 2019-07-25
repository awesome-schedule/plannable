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
import { SearchMatch } from '@/models/Catalog';

/**
 * the modal module handles modal triggering
 */
class Modal {
    section: Section | null = null;
    course: Course | null = null;
    url: string = '';
    match: SearchMatch = [[], new Map()];

    showSectionModal(section: Section) {
        this.section = section;
        $('#section-modal').modal();
    }

    showCourseModal(course: Course, match?: SearchMatch) {
        console.log(arguments);
        this.course = course;
        this.match = match || [[], new Map()];
        $('#course-modal').modal();
    }

    showURLModal(url: string) {
        this.url = url;
        $('#url-modal').modal();
    }
}

export const modal = new Modal();
export default modal;
