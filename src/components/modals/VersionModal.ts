/**
 * @module src/components
 */

/**
 *
 */
import { Component, Prop, Vue } from 'vue-property-decorator';
/**
 * component for displaying version information
 * @author Kaiying Shan
 * @noInheritDoc
 */
@Component
export default class VersionModal extends Vue {
    @Prop(String) readonly version!: string;
}
