import { Vue, Component, Watch } from 'vue-property-decorator';
import schedule from '../store/schedule';
import App from '../App';
import semester from '../store/semester';
import Course from '../models/Course';
import noti from '../store/notification';
import display from '@/store/display';
import ClassList from './ClassList.vue';
import { saveStatus } from '@/store/helper';

@Component({
    components: {
        ClassList
    }
})
export default class ClassView extends Vue {
    $parent!: App;

    // autocompletion related fields
    isEntering = false;
    inputCourses: Course[] | null = null;

    get schedule() {
        return schedule;
    }
    get semester() {
        return semester;
    }
    get display() {
        return display;
    }

    /**
     * get classes that match the input query.
     * Exit "entering" mode on falsy parameter (set `isEntering` to false)
     *
     * @see Catalog.search
     */
    getClass(query: string) {
        if (!query) {
            this.isEntering = false;
            this.inputCourses = null;
            return;
        }
        // if current schedule is displayed, switch to proposed schedule
        // because we're adding stuff to the proposed schedule
        if (schedule.generated) {
            schedule.switchSchedule(false);
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
        schedule.currentSchedule.update(key, section, remove);
        if (schedule.generated) {
            noti.warn(`You're editing the generated schedule!`, 3);
        } else {
            saveStatus();
        }
        // note: adding a course to schedule.All cannot be detected by Vue.
        // Must use forceUpdate to re-render component
        (this.$refs.selectedClassList as Vue).$forceUpdate();
        const classList = this.$refs.enteringClassList;
        if (classList instanceof Vue) (classList as Vue).$forceUpdate();
    }

    removeCourse(key: string) {
        schedule.currentSchedule.remove(key);
        if (schedule.generated) {
            noti.warn(`You're editing the generated schedule!`, 3);
        } else {
            saveStatus();
        }
    }
}
