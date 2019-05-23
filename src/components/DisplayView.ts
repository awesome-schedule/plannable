import { Vue, Component } from 'vue-property-decorator';
import display from '../store/display';
import semester from '../store/semester';
import schedule from '../store/schedule';

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
