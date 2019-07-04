/**
 * @module components
 */
import $ from 'jquery';
import 'bootstrap';
import { Vue, Component, Prop } from 'vue-property-decorator';
/**
 * component for displaying and copying URL created by [[ExportView]]
 * @author Hanzhi Zhou
 */
@Component
export default class URLModal extends Vue {
    @Prop(String) readonly url!: string;

    handler = -1;

    copy() {
        const box = document.getElementById('url-text') as HTMLTextAreaElement;
        const pop = $('#copy-url-btn');
        box.focus();
        box.select();
        const succ = document.execCommand('copy');

        if (!succ) console.error('unsuccessful copy');
        else pop.popover('show');

        window.clearTimeout(this.handler);
        this.handler = window.setTimeout(() => pop.popover('dispose'), 2000);
    }
}
