/**
 *
 */
import { Vue, Component } from 'vue-property-decorator';
import filter from '../store/filter';
import display from '../store/display';
import Meta from '../models/Meta';
import App from '../App';
import draggable from 'vuedraggable';

@Component({
    components: {
        draggable
    }
})
export default class FilterView extends Vue {
    $parent!: App;
    get filter() {
        return filter;
    }
    get display() {
        return display;
    }
    get days() {
        return Meta.days;
    }
    dragEnd() {
        if (filter.sortOptions.mode === 0) filter.changeSorting(undefined);
    }
}
