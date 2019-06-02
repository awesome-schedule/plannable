/**
 * @module components/tabs
 */
import { Component, Vue } from 'vue-property-decorator';
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

    async created() {
        if (!window.catalog.worker) {
            this.loading = true;
            this.noti.info('Gathering data for fuzzy search...');
            await window.catalog.initWorker();
            this.noti.success('Success!', 2.5);
            this.loading = false;
        }
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
    async getClass(query: string) {
        if (!query) {
            this.isEntering = false;
            this.inputCourses = null;
            return;
        }
        this.loading = true;
        if (this.schedule.generated) this.schedule.switchSchedule(false);
        window.catalog.initWorker();

        console.time('query');
        this.inputCourses = await window.catalog.fuzzySearch(query);
        console.log(this.inputCourses);
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
        const classList = this.$refs.enteringClassList;
        if (classList instanceof Vue) (classList as Vue).$forceUpdate();
        this.saveStatus();
    }
}
