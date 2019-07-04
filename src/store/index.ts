/**
 * The Store module provides methods to save, retrieve and manipulate store.
 * It gathers all children modules and store their references in a single store class,
 * which is provided as a Mixin
 * @module store
 * @preferred
 */

/**
 *
 */
import Store from './store';
export default Store;
export * from './store';
import WatchFactory from './watch';
declare global {
    interface Window {
        watchers: WatchFactory;
    }
}
// just need to instantiate it
window.watchers = new WatchFactory();
