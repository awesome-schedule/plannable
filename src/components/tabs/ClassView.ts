/**
 * Tabs components, shown when their corresponding tabs are active
 * @module components/tabs
 * @preferred
 */

/**
 *
 */
import { SearchMatch } from '@/models/Catalog';
import Course from '@/models/Course';
import Store from '@/store';
import { Component, Vue } from 'vue-property-decorator';
import ClassList from '../ClassList.vue';

/**
 * component for editing classes and manipulating schedules
 * @author Hanzhi Zhou
 * @noInheritDoc
 */
@Component({
    components: {
        ClassList
    }
})
export default class ClassView extends Store {
    // autocompletion related fields
    isEntering = false;
    inputCourses: Course[] = [];
    inputMatches: SearchMatch[] = [];

    get current() {
        return this.schedule.currentSchedule.current;
    }

    /**
     * get classes that match the input query.
     * Exit "entering" mode on falsy parameter (set `isEntering` to false)
     *
     * if a generated schedule is displayed, switch to proposed schedule,
     * because we're adding stuff to the proposed schedule
     *
     * @see Catalog.search
     */
    getClass(query: string) {
        if (!query) {
            this.isEntering = false;
            this.inputCourses = [];
            this.inputMatches = [];
            return;
        }
        if (this.schedule.generated) {
            this.schedule.switchSchedule(false);
        }

        console.time('query');
        [this.inputCourses, this.inputMatches] = window.catalog.search(
            query,
            this.display.numSearchResults
        );
        console.timeEnd('query');

        this.isEntering = true;
    }

    closeClassList() {
        (this.$refs.classSearch as HTMLInputElement).value = '';
        this.getClass('');
    }

    /**
     * @see Schedule.update
     */
    updateCourse(key: string, section: number, remove = false) {
        this.schedule.currentSchedule.update(key, section, remove);
        if (this.schedule.generated) this.noti.warn(`You're editing the generated schedule!`);

        // note: adding a course to schedule.All cannot be detected by Vue.
        // Must use forceUpdate to re-render component
        (this.$refs.selectedClassList as Vue).$forceUpdate();
        const classList = this.$refs.enteringClassList;
        if (classList instanceof Vue) (classList as Vue).$forceUpdate();
        this.saveStatus();
    }

    removeCourse(key: string) {
        if (this.schedule.generated) this.noti.warn(`You're editing the generated schedule!`);
        this.schedule.currentSchedule.remove(key);
        this.saveStatus();
    }
}
