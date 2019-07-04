/**
 * @module components
 */
import { Component } from 'vue-property-decorator';
import Store from '../store';
import config from '../config';

/**
 * the container for the notification and content right of the side bar
 * @author Hanzhi Zhou
 */
@Component
export default class MainContent extends Store {
    scrollable = false;
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
}
