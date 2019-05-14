import Vuex from 'vuex';
import Vue from 'vue';
import { DisplayState } from './display';
import { NotiState } from './notification';

Vue.use(Vuex);

export interface RootState {
    display: DisplayState;
    noti: NotiState;
}

// export * from './display';
// export * from './notification';

export const store = new Vuex.Store<RootState>({
    strict: process.env.NODE_ENV !== 'production'
});
export default store;
