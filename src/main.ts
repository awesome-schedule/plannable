import Vue from 'vue';
import App from './App.vue';
import querystring from 'querystring';
import axios from 'axios';
import { openLousList, openVAGrade } from './models/Utils';

(window as any).axios = axios;
(window as any).querystring = querystring;

Vue.config.productionTip = false;
Vue.prototype.openLousList = openLousList;
Vue.prototype.openVAGrade = openVAGrade;

new Vue({
    render: h => h(App)
}).$mount('#app');
