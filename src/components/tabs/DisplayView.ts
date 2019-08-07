/**
 * @module components/tabs
 */
import Store from '@/store';
import { Component } from 'vue-property-decorator';

/**
 * component for editing display settings
 * @author Kaiying Shan, Hanzhi Zhou
 */
@Component
export default class DisplayView extends Store {
    /**
     * clear the localStorage and reload the page
     */
    clearCache() {
        if (confirm('Your selected classes and schedules will be cleaned. Are you sure?')) {
            window.localStorage.clear();
            window.location.reload(true);
        }
    }
}
