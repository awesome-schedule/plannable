/**
 * Tabs components, shown when their corresponding tabs are active
 * @module src/components/tabs
 * @preferred
 */

/**
 *
 */
import { SearchMatch } from '@/models/Catalog';
import Course from '@/models/Course';
import Store from '@/store';
import { Component, Vue, Watch } from 'vue-property-decorator';
import ClassList from '../ClassList.vue';
import VueTypeaheadBootstrap from '../autocomplete/VueTypeaheadBootstrap.vue';

const generatedWarning = `You're editing the generated schedule! You should do 'change to proposed' if you want to add on this particular generated schedule.`;

/**
 * component for editing classes and manipulating schedules
 * @author Hanzhi Zhou
 * @noInheritDoc
 */
@Component({
    components: {
        ClassList,
        VueTypeaheadBootstrap
    }
})
export default class ClassView extends Store {
    // autocompletion related fields
    isEntering = false;
    inputCourses: Course[] = [];
    inputMatches: SearchMatch[] = [];
    query = '';
    queryTypes: string[] = [':title ', ':num ', ':topic ', ':prof ', ':desc ', ':room '];

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
    @Watch('query')
    getClass() {
        if (!this.query) {
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
            this.query,
            this.display.numSearchResults
        );
        console.timeEnd('query');

        this.isEntering = true;
    }

    closeClassList() {
        this.query = '';
    }

    generateClick() {
        this.query = '';
        this.generateSchedules();
    }

    /**
     * @see Schedule.update
     */
    updateCourse(key: string, section: number, groupIdx = 0, remove = false) {
        try {
            this.schedule.currentSchedule.update(key, section, groupIdx, remove);
        } catch (e) {
            this.noti.warn(e.message || generatedWarning);
        }

        // note: adding a course to schedule.All cannot be detected by Vue.
        // Must use forceUpdate to re-render component
        (this.$refs.selectedClassList as Vue).$forceUpdate();
        const classList = this.$refs.enteringClassList;
        if (classList instanceof Vue) (classList as Vue).$forceUpdate();
        this.saveStatus();
    }

    removeCourse(key: string) {
        try {
            this.schedule.currentSchedule.remove(key);
        } catch (e) {
            this.noti.warn(e.message || generatedWarning);
        }
        this.saveStatus();
    }
}
