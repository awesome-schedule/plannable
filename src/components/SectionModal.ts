import { Vue, Component, Prop } from 'vue-property-decorator';
import Section from '@/models/Section';
import { SemesterJSON } from '@/models/Catalog';
@Component
export default class SectionModal extends Vue {
    @Prop(Section) readonly section!: Section;
    @Prop(Object) readonly semester!: SemesterJSON;
}
