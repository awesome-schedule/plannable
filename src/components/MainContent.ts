/**
 * @module src/components
 */

/**
 *
 */
import { viewReleaseNote } from '@/utils';
import { Component } from 'vue-property-decorator';
import { ui as config, version } from '@/config';
import Store from '../store';

/**
 * the container for the notification and content right of the side bar
 * @author Hanzhi Zhou
 * @noInheritDoc
 */
@Component
export default class MainContent extends Store {
    get scheduleWidth() {
        return this.status.sideBarActive
            ? 100 - config.sideBarWidth - config.tabBarWidth - config.sideMargin
            : 100 - config.tabBarWidth - config.sideMargin;
    }
    get scheduleLeft() {
        return this.status.sideBarActive
            ? config.sideBarWidth + config.tabBarWidth + 1
            : config.tabBarWidth;
    }
    get version() {
        return version;
    }
    viewReleaseNote() {
        viewReleaseNote();
    }
}
