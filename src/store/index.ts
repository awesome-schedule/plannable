import Vuex from 'vuex';
import Vue from 'vue';
import { DisplayState } from './display';

Vue.use(Vuex);

export interface RootState {
    display: DisplayState;
}

export default new Vuex.Store<RootState>({});
