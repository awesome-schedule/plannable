import Vue from 'vue';
import App from './App.vue';
import axios from 'axios';
import querystring from 'querystring';
(window as any).axios = axios;
(window as any).querystring = querystring;

Vue.config.productionTip = false;

new Vue({
    render: h => h(App)
}).$mount('#app');
