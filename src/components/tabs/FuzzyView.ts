/**
 * @module src/components/tabs
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
 * component for performing fuzzy-search against the catalog of courses
 * @author Hanzhi Zhou
 * @noInheritDoc
 */
@Component({
    components: {
        ClassList
    }
})
export default class FuzzyView extends Store {
    inputCourses: Course[] = [];
    inputMatches: SearchMatch[] = [];

    /**
     * represent the current state of the fuzzy search component.
     * disable the input box if true
     */
    loading = false;

    realtime = true;

    onInput(query: string) {
        if (this.realtime) this.getClass(query);
        else if (!query) this.getClass('');
    }

    /**
     * get classes that match the input query.
     * clear search results on falsy parameter.
     *
     * if a generated schedule is displayed, switch to proposed schedule,
     * because we're adding stuff to the proposed schedule
     *
     * @see Catalog.search
     */
    async getClass(query: string) {
        if (!query) {
            this.inputCourses = [];
            this.inputMatches = [];
            return;
        }
        this.loading = true;
        if (this.schedule.generated) this.schedule.switchSchedule(false);

        [this.inputCourses, this.inputMatches] = window.catalog.fuzzySearch(query);
    }

    closeClassList() {
        (this.$refs.classSearch as HTMLInputElement).value = '';
        this.getClass('');
    }

    /**
     * @see Schedule.update
     */
    updateCourse(key: string, section: number, group = 0, remove = false) {
        this.schedule.currentSchedule.update(key, section, group, remove);

        // note: adding a course to schedule.All cannot be detected by Vue.
        // Must use forceUpdate to re-render component
        const classList = this.$refs.enteringClassList;
        if (classList instanceof Vue) (classList as Vue).$forceUpdate();
        this.saveStatus();
    }
}
