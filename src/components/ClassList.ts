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
    @Prop(Array) readonly courses!: Course[];
    @Prop(Schedule) readonly schedule!: Schedule;
    @Prop({ default: false, type: Boolean }) readonly isEntering!: boolean;
    @Prop(Boolean) readonly generated!: boolean;
    @Prop(Boolean) readonly showClasslistTitle!: boolean;

    collapsed: { [x: string]: string } = {};
    expandOnEntering = false;

    select(key: string, idx: number) {
        this.$emit('update_course', key, idx, this.isEntering);
    }

    collapse(key: string) {
        if (this.collapsed[key]) {
            this.$set(this.collapsed, key, undefined);
        } else {
            this.$set(this.collapsed, key, key);
        }
    }
    isActive(key: string, idx: number) {
        const sections = this.schedule.All[key];
        if (sections instanceof Set) return sections.has(idx);
        return false;
    }
    expanded(key: string) {
        return (this.collapsed[key] !== undefined) !== (this.isEntering && this.expandOnEntering)
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
