import Vue from 'vue';
import App from './App.vue';
import querystring from 'querystring';
import axios from 'axios';
import { openLousList, openVAGrade } from './utils';
import ScheduleEvaluator from './algorithm/ScheduleEvaluator';
import Catalog, { Semester } from './models/Catalog';
import Vuetify from 'vuetify';

Vue.use(Vuetify);

declare global {
    interface Window {
        axios: typeof axios;
        querystring: typeof querystring;
        scheduleEvaluator: ScheduleEvaluator;
        catalog: Catalog;
        timeMatrix: Int32Array;
        buildingList: string[];
        semesters: Semester[];
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
