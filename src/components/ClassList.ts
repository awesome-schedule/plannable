/**
 * Miscellaneous components used in tabs and App.vue
 * @module components
 * @preferred
 */

/**
 *
 */
import { SearchMatch } from '@/models/Catalog';
import { Component, Prop, Vue } from 'vue-property-decorator';
import Course from '../models/Course';
import Schedule from '../models/Schedule';
import Expand from './Expand.vue';
import ProposedSchedule from '@/models/ProposedSchedule';
import GeneratedSchedule from '@/models/GeneratedSchedule';

/**
 * A **pure** component for
 * 1. displaying the list of courses that are match the query string when searching
 * 2. displaying the list of courses currently selected
 * @author Hanzhi Zhou, Kaiying Cat
 * @noInheritDoc
 */
@Component({
    components: {
        Expand
    }
})
export default class ClassList extends Vue {
    /**
     * the array of courses to be displayed on this list
     */
    @Prop({ type: Array, default: [] }) readonly courses!: Course[];
    /**
     * the array of matches corresponding to the array of courses
     */
    @Prop({ type: Array, default: [] }) readonly matches!: SearchMatch[];
    /**
     * the schedule used to extract the already selected sections of the courses given above
     */
    @Prop(Object) readonly schedule!: Schedule;
    /**
     * whether in Entering mode. when true, no **close** buttons (for removing courses) will be shown
     */
    @Prop({ default: false, type: Boolean }) readonly isEntering!: boolean;
    /**
     * whether to show **Any Section**
     */
    @Prop({ default: true, type: Boolean }) readonly showAny!: boolean;
    /**
     * whether to expand all courses by default in entering mode
     */
    @Prop({ default: false, type: Boolean }) readonly expandOnEntering!: boolean;
    @Prop({ default: true, type: Boolean }) readonly showClasslistTitle!: boolean;

    /**
     * the array used to record which course is collapsed/expanded
     *
     * key: the key of the course (`course.key`)
     * value: true for collapsed, false otherwise
     */
    collapsed: { [x: string]: boolean } = {};

    select(key: string, idx: number) {
        // need to pass this event to parent because the parent needs to update some other stuff
        this.$emit('update_course', key, idx, this.isEntering);
    }

    selectAll(key: string, course: Course) {
        let notSelected = false;
        for (const sec of course.sections) {
            if (!this.schedule.hasSection(key, sec.id)) {
                notSelected = true;
                this.select(key, sec.id);
            }
        }
        if (!notSelected) {
            for (const sec of course.sections) {
                this.select(key, sec.id);
            }
        }
    }

    allTimeSelected(key: string, time: string) {
        return this.separatedCourses[key][time].sections.every(sec =>
            this.schedule.hasSection(key, sec.id)
        );
    }

    get separatedCourses() {
        const courseObj: { [course: string]: { [date: string]: Course } } = Object.create(null);
        for (const course of this.courses) {
            const obj: { [date: string]: Set<number> } = Object.create(null);
            const sections = course.sections;
            // group sections by dates
            for (const { dates, id } of sections) {
                if (obj[dates]) {
                    obj[dates].add(id);
                } else {
                    obj[dates] = new Set<number>().add(id);
                }
            }

            const segments: { [date: string]: Course } = Object.create(null);
            const len = course.sections.length;
            for (const date in obj) {
                // all sections are selected: use the full course
                if (obj[date].size === len) {
                    segments[date] = course;
                    // some sections are selected: get the subset
                } else {
                    segments[date] = window.catalog.getCourse(course.key, obj[date]);
                }
            }
            courseObj[course.key] = segments;
        }
        return courseObj;
    }

    /**
     * update the collapse status of the course with key=`key`
     * @param key
     */
    collapse(key: string) {
        if (this.expanded(key)) {
            this.$set(this.collapsed, key, false);
        } else {
            this.$set(this.collapsed, key, true);
        }
    }
    /**
     * returns whether course with key=`key` is expanded
     * @param key
     */
    expanded(key: string) {
        const status = this.collapsed[key];
        return (status === undefined && this.isEntering && this.expandOnEntering) || status;
    }
}
