import { SemesterJSON } from '../models/Catalog';
import Vue from 'vue';
import modal from '../store/modal';

export default Vue.extend({
    props: {
        semester: Object as () => SemesterJSON
    },
    computed: {
        section() {
            return modal.modalSection;
        }
    }
});
