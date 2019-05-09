import { Vue, Component, Prop } from 'vue-property-decorator';
import Schedule from '../models/Schedule';
import Expand from './Expand.vue';
import Course from '../models/Course';

@Component({
    components: {
        Expand
    }
})
export default class ClassList extends Vue {
    /**
     * the array of courses to be displayed on this list
     */
    @Prop(Array) readonly courses!: Course[];
    /**
     * the schedule used to extract the already selected sections of the courses given above
     */
    @Prop(Schedule) readonly schedule!: Schedule;
    @Prop({ default: false, type: Boolean }) readonly isEntering!: boolean;
    @Prop(Boolean) readonly generated!: boolean;
    @Prop(Boolean) readonly showClasslistTitle!: boolean;

    /**
     * the array used to record which course is collapsed/expanded
     *
     * key: the key of the course (`course.key`)
     * value: true for collapsed, false otherwise
     */
    collapsed: { [x: string]: boolean } = {};
    /**
     * whether to expand all courses by default in entering mode
     */
    expandOnEntering = false;

    select(key: string, idx: number) {
        // need to pass this event to parent (App.vue) because the parent needs to update some other stuff
        this.$emit('update_course', key, idx, this.isEntering);
    }

    /**
     * update the collapse status of the course with key=`key`
     * @param key
     */
    collapse(key: string) {
        if (this.collapsed[key]) {
            this.$set(this.collapsed, key, false);
        } else {
            this.$set(this.collapsed, key, true);
        }
    }
    /**
     * returns whether the `idx` section of the course with key `key` is selected
     */
    isActive(key: string, idx: number) {
        const sections = this.schedule.All[key];
        if (sections instanceof Set) return sections.has(idx);
        return false;
    }
    expanded(key: string) {
        return this.collapsed[key] === (this.isEntering && this.expandOnEntering)
            ? 'fa-chevron-down'
            : 'fa-chevron-right';
    }
    preview(key: string, idx: number) {
        this.schedule.preview(key, idx);
    }
    removePreview() {
        this.schedule.removePreview();
    }
}
