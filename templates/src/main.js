import Vue from 'vue';
import axios from 'axios';
import App from './App.vue';

import './schedule';

Vue.config.productionTip = false;

Vue.prototype.$http = axios;
Vue.prototype.Set = Set;

new Vue({
    render: h => h(App)
}).$mount('#app');
