/**
 * the entry point of our project
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

declare global {
    interface Window {
        scheduleEvaluator: ScheduleEvaluator;
        catalog: Readonly<Catalog>;
        timeMatrix: Readonly<Int32Array>;
        buildingSearcher: FastSearcher;
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

new Vue({
    data: {
        currentRoute: window.location.pathname
    },
    render(h) {
        // const matchingView = routes[this.currentRoute];
        // const component = matchingView ? matchingView : HomePage;
        return h(App);
    }
}).$mount('#app');
