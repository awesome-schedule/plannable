/**
 * @module components/tabs
 */
import { Component } from 'vue-property-decorator';
import Store from '@/store';
import Course from '@/models/Course';
import ClassList from '../ClassList.vue';

/**
 * component for editing classes and manipulating schedules
 * @author Hanzhi Zhou
 */
@Component({
    components: {
        ClassList
    }
})
export default class FuzzyView extends Store {
    isEntering = false;
    inputCourses: Course[] | null = null;
    loading = false;

    /**
     * get classes that match the input query.
     * Exit "entering" mode on falsy parameter (set `isEntering` to false)
     *
     * if a generated schedule is displayed, switch to proposed schedule,
     * because we're adding stuff to the proposed schedule
     *
     * @see Catalog.search
     */
    async getClass(query: string) {
        if (!query) {
            this.isEntering = false;
            this.inputCourses = null;
            return;
        }
        this.loading = true;
        if (this.schedule.generated) {
            this.schedule.switchSchedule(false);
        }

        console.time('query');
        this.inputCourses = await window.catalog.fuzzySearch(query); // this.display.numSearchResults
        console.timeEnd('query');

        this.isEntering = true;
        this.loading = false;
    }

    closeClassList() {
        (this.$refs.classSearch as HTMLInputElement).value = '';
        this.getClass('');
    }

    /**
     * @see Schedule.update
     */
    updateCourse(key: string, section: number, remove: boolean = false) {
        this.schedule.currentSchedule.update(key, section, remove);
        if (this.schedule.generated) this.noti.warn(`You're editing the generated schedule!`);

        // note: adding a course to schedule.All cannot be detected by Vue.
        // Must use forceUpdate to re-render component
        this.$forceUpdate();
        this.saveStatus();
    }
}
