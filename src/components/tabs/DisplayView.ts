/**
 * @module components/tabs
 */

/**
 *
 */
import CatalogDB from '@/database/CatalogDB';
import Store from '@/store';
import { Component } from 'vue-property-decorator';

/**
 * component for editing display settings
 * @author Kaiying Shan, Hanzhi Zhou
 * @noInheritDoc
 */
@Component
export default class DisplayView extends Store {
    /**
     * clear the localStorage and reload the page
     */
    async clearCache() {
        if (confirm('Your selected classes and schedules will be cleaned. Are you sure?')) {
            window.localStorage.clear();
            const { currentSemester } = this.semester;
            if (currentSemester) new CatalogDB(currentSemester).delete();
            window.location.reload(true);
        }
    }
}
