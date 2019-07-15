/**
 * @module components
 */
import { Vue, Component, Prop } from 'vue-property-decorator';
import Section from '@/models/Section';
import { SemesterJSON } from '@/models/Catalog';

/**
 * Component for displaying detailed information of a single Section
 * @author Kaiying Shan, Hanzhi Zhou
 */
@Component
export default class SectionModal extends Vue {
    @Prop(Section) readonly section!: Section;
    @Prop(Object) readonly semester!: SemesterJSON;

    get dates() {
        return this.section.meetings.reduce((acc: string[], x, i) => {
            if (i > 0) {
                acc.push(x.dates === acc[i - 1] ? '' : x.dates);
            } else {
                acc.push(x.dates);
            }
            return acc;
        }, []);
    }
}
