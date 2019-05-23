import { Vue, Component } from 'vue-property-decorator';
import { display, semester, schedule } from '../store';

@Component
export default class DisplayView extends Vue {
    get display() {
        return display;
    }
    get semester() {
        return semester;
    }
    get schedule() {
        return schedule;
    }
}
