import Vue from 'vue';
import App from './App.vue';
import querystring from 'querystring';
import axios from 'axios';
import { openLousList, openVAGrade } from './models/Utils';
import ScheduleEvaluator from './algorithm/ScheduleEvaluator';
import Catalog from './models/Catalog';

declare global {
    interface Window {
        axios: typeof axios;
        querystring: typeof querystring;
        scheduleEvaluator: ScheduleEvaluator;
        catalog: Catalog;
    }
}

Vue.directive('top', {
    // When the bound element is inserted into the DOM...
    inserted: el => {
        // scroll to top
        window.scrollTo(0, 0);
    }
});

window.axios = axios;
window.querystring = querystring;

Vue.config.productionTip = false;
Vue.prototype.openLousList = openLousList;
Vue.prototype.openVAGrade = openVAGrade;

new Vue({
    render: h => h(App)
}).$mount('#app');
