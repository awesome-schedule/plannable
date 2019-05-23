import Vue from 'vue';
import { semester, modal } from '../store';

export default Vue.extend({
    computed: {
        section() {
            return modal.modalSection;
        },
        semester() {
            return semester.currentSemester;
        }
    }
});
