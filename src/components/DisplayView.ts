import { Vue, Component, Prop } from 'vue-property-decorator';
import display from '@/store/display';
import App from '@/App';

@Component
export default class DisplayView extends Vue {
    $parent!: App;
    get display() {
        return display;
    }
}
