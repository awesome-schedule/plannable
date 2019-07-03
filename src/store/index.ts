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
