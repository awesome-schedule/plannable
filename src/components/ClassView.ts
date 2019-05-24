import { Component, Vue, Mixins, Watch } from 'vue-property-decorator';
import Course from '../models/Course';
import Store from '../store';
import ClassList from './ClassList.vue';
import Schedule from '@/models/Schedule';

@Component({
    components: {
        ClassList
    }
})
export default class ClassView extends Mixins(Store) {
    /**
     * get the list of current ids, sorted in alphabetical order of the keys
     */
    get currentIds(): Array<[string, string]> {
        return Object.entries(this.schedule.currentSchedule.currentIds).sort((a, b) =>
            a[0] === b[0] ? 0 : a[0] < b[0] ? -1 : 1
        );
    }
    // autocompletion related fields
    isEntering = false;
    inputCourses: Course[] | null = null;

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
            this.inputCourses = null;
            return;
        }
        if (this.schedule.generated) {
            this.schedule.switchSchedule(false);
        }
        this.inputCourses = window.catalog.search(query);
        this.isEntering = true;
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
        if (this.schedule.generated) this.noti.warn(`You're editing the generated schedule!`, 3);

        // note: adding a course to schedule.All cannot be detected by Vue.
        // Must use forceUpdate to re-render component
        (this.$refs.selectedClassList as Vue).$forceUpdate();
        const classList = this.$refs.enteringClassList;
        if (classList instanceof Vue) (classList as Vue).$forceUpdate();
    }

    removeCourse(key: string) {
        this.schedule.currentSchedule.remove(key);
        if (this.schedule.generated) this.noti.warn(`You're editing the generated schedule!`, 3);
    }
}
