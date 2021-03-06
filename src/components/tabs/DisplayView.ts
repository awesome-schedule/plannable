/**
 * @module src/components/tabs
 */

/**
 *
 */
import { options } from '@/algorithm/Renderer';
import CatalogDB from '@/data/CatalogDB';
import Store from '@/store';
import { Component, Watch } from 'vue-property-decorator';

/**
 * component for editing settings. This component should really be named as `SettingsView`,
 * but it is called `DisplayView` for historical reasons.
 * @author Kaiying Shan, Hanzhi Zhou
 * @noInheritDoc
 */
@Component
export default class DisplayView extends Store {
    options = options;
    showRenderingOptions = process.env.NODE_ENV === 'development';
    @Watch('options', { deep: true }) private w1() {
        this.schedule.recomputeAll(false, 100);
    }
    /**
     * clear the localStorage and reload the page
     */
    async clearCache() {
        if (confirm('Your selected classes and schedules will be cleaned. Are you sure?')) {
            window.localStorage.clear();
            if (this.semester.current) new CatalogDB(this.semester.current).delete();
            window.location.reload(true);
        }
    }
}
