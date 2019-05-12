import Vuex from 'vuex';
import Vue from 'vue';
import { DisplayState } from './display';
import { NotiState } from './notification';

Vue.use(Vuex);

export interface RootState {
    display: DisplayState;
    noti: NotiState;
}

export default new Vuex.Store<RootState>({
    strict: process.env.NODE_ENV !== 'production'
});
