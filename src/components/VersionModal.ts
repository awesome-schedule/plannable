/**
 * @module components
 */
import { Component, Vue, Prop } from 'vue-property-decorator';
/**
 * component for displaying version information
 * @author Kaiying Shan
 */
@Component
export default class VersionModal extends Vue {
    @Prop(String) readonly version!: string;

    refreshNote() {
        this.$emit('ref_note');
    }
}
