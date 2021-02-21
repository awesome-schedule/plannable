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

declare global {
    // ! for parameter meaning, refer to the cpp files in src/algorithm
    interface EMModule {
        _malloc(size: number): Ptr;

        // ------------ APIs of Renderer.cpp --------------------------------------
        _setOptions(...a: number[]): void;
        _getSum(): number;
        _getSumSq(): number;
        _compute(a: Ptr, b: number): Ptr;
        // ------------------------------------------------------------------------

        // ------------ APIs of ScheduleGenerator.cpp -----------------------------
        _generate(a: number, b: number, c: Ptr, d: Ptr, e: Ptr): number;
        _setSortOption: any;
        _setSortMode(a: number): void;
        _sort(): void;
        _size(): number;
        _setTimeMatrix(a: Ptr, b: number): void;
        _getSchedule(a: number): Ptr;
        _getRange(a: number): number;
        _setRefSchedule(a: Ptr): number;
        // ------------------------------------------------------------------------

        // ------------ APIs of Searcher.cpp --------------------------------------
        _getSearcher(stringArr: Ptr, N: number): Ptr;
        _sWSearch(a: Ptr, b: Ptr, c: number, d: number, e: number): Ptr;
        _getMatches(a: Ptr): Ptr;
        _getMatchSize(a: Ptr): number;
        _findBestMatch(a: Ptr, b: Ptr): void;
        _getBestMatchIndex(): number;
        _getBestMatchRating(): number;
        // ------------------------------------------------------------------------

        onRuntimeInitialized(): void;
        stringToUTF8(str: string, outPtr: Ptr, maxBytesToWrite: number): void;
        HEAP8: Int8Array;
        HEAP16: Int16Array;
        HEAP32: Int32Array;
        HEAPU8: Uint8Array;
        HEAPU16: Uint16Array;
        HEAPU32: Uint32Array;
        HEAPF32: Float32Array;
        HEAPF64: Float64Array;
    }

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
