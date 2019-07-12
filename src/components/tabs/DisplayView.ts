/**
 * @module components/tabs
 */
import { Component } from 'vue-property-decorator';
import Store from '@/store';

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
