import Vue from 'vue';
import App from './App.vue';
import querystring from 'querystring';
(window as any).querystring = querystring;

Vue.config.productionTip = false;

new Vue({
    render: h => h(App)
}).$mount('#app');
