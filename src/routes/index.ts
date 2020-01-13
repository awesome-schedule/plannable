/**
 * the routes module, currently unused
 * @module routes
 * @preferred
 */

/**
 *
 */
import HomePage from './HomePage.vue';
import App from '../App.vue';
import { VueConstructor } from 'vue';

export const routes: { [x: string]: VueConstructor } = {
    '/': HomePage,
    '/uva': App
};
