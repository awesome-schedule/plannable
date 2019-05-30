/**
 * the entry point of our project
 * @author Hanzhi Zhou
 */

/**
 *
 */
import axios from 'axios';
import querystring from 'querystring';
import Vue from 'vue';
import ScheduleEvaluator from './algorithm/ScheduleEvaluator';
import App from './App.vue';
import Catalog from './models/Catalog';
import { highlightMatch, openLousList, openVAGrade } from './utils';
import 'vuetify/src/stylus/app.styl';

import Vuetify, {
    VApp, // required
    VFooter,
    VCard,
    VCardTitle,
    VCardText,
    VCardActions,
    VIcon,
    VBtn
} from 'vuetify/lib';

Vue.use(Vuetify, {
    iconfont: 'fa',
    icons: {
        complete: 'fas fa-check'
    },
    components: {
        VApp, // required
        VFooter,
        VCard,
        VCardTitle,
        VCardText,
        VCardActions,
        VIcon,
        VBtn
    }
});

declare global {
    interface Window {
        axios: typeof axios;
        querystring: typeof querystring;
        scheduleEvaluator: ScheduleEvaluator;
        catalog: Catalog;
        timeMatrix: Int32Array;
        buildingList: string[];
    }
}

declare module 'vue/types/vue' {
    // Declare augmentation for Vue
    interface Vue {
        openLousList: typeof openLousList;
        openVAGrade: typeof openVAGrade;
        highlightMatch: typeof highlightMatch;
    }
}

Vue.directive('top', {
    // When the bound element is inserted into the DOM...
    inserted: () => {
        // scroll to top
        window.scrollTo(0, 0);
    }
});

window.axios = axios;
window.querystring = querystring;

Vue.config.productionTip = false;
Vue.prototype.openLousList = openLousList;
Vue.prototype.openVAGrade = openVAGrade;
Vue.prototype.highlightMatch = highlightMatch;

new Vue({
    render: h => h(App)
}).$mount('#app');
