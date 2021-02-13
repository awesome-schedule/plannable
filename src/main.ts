/**
 * the entry point of our project
 * @module src/main
 * @author Hanzhi Zhou
 */

/**
 *
 */
import Vue from 'vue';
import ScheduleEvaluator from './algorithm/ScheduleEvaluator';
import Catalog from './models/Catalog';
import { highlightMatch } from './utils';
import { FastSearcher } from './algorithm/Searcher';
import App from './App.vue';
import axios from 'axios';
import WatchFactory from './store/watch';
import { saveStatus } from './store';

axios.defaults.xsrfHeaderName = 'X-CSRFTOKEN';
axios.defaults.xsrfCookieName = 'csrftoken';

// denote the pointer type, though it is just an integer in JS
type Ptr = number;
interface EMModule {
    _malloc(size: number): Ptr;
    _free(ptr: Ptr): void;
    _setOptions(a: number, b: number, c: number, d: number, e: number, f: number): void;
    _getSum(): number;
    _getSumSq(): number;
    _compute(a: Ptr, b: number): Ptr;
    onRuntimeInitialized(): void;
    HEAP8: Int8Array;
    HEAP16: Int16Array;
    HEAP32: Int32Array;
    HEAPU8: Uint8Array;
    HEAPU16: Uint16Array;
    HEAPU32: Uint32Array;
    HEAPF64: Float64Array;
}

declare global {
    interface Window {
        scheduleEvaluator: ScheduleEvaluator;
        catalog: Readonly<Catalog>;
        timeMatrix: Readonly<Int32Array>;
        buildingSearcher: FastSearcher<string>;
        watchers: WatchFactory;
        saveStatus: typeof saveStatus;
        NativeModule: EMModule;
        GetNative(): Promise<EMModule>;
    }

    // copied from https://www.typescriptlang.org/docs/handbook/advanced-types.html
    type NonFunctionPropertyNames<T> = {
        [K in keyof T]: T[K] extends (...x: any[]) => any ? never : K;
    }[keyof T];
    type NonFunctionProperties<T> = Pick<T, NonFunctionPropertyNames<T>>;
}

declare module 'vue/types/vue' {
    // Declare augmentation for Vue
    interface Vue {
        highlightMatch: typeof highlightMatch;
    }
}

Vue.directive('top', {
    // When the bound element is inserted into the DOM...
    inserted() {
        // scroll to top
        window.scrollTo(0, 0);
    }
});

Vue.config.productionTip = false;
Vue.config.devtools = true;
Vue.prototype.highlightMatch = highlightMatch;

window.saveStatus = saveStatus;
window.watchers = new WatchFactory();

new Vue({
    render(h) {
        // const matchingView = routes[this.currentRoute];
        // const component = matchingView ? matchingView : HomePage;
        return h(App);
    }
}).$mount('#app');
