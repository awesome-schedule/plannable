/**
 * @module src/components
 */

/**
 *
 */
import { Vue, Prop, Component } from 'vue-property-decorator';
type StepperInfo = { title: string; src: string }[];

/**
 * @author Kaiying Shan
 */
@Component
export default class Stepper extends Vue {
    @Prop(Array) readonly info!: StepperInfo;
    // show the "next" and "back" button or not
    @Prop(Boolean) readonly helper!: boolean;
    // always show title or show only when in current page
    @Prop(Boolean) readonly alwaysTitle!: boolean;

    curItem = this.info.length ? this.info[0] : { title: '', src: '' };
    curIdx = 0;

    goto(idx: number) {
        this.curIdx = idx;
    }
    next() {
        this.goto((this.curIdx + 1) % this.info.length);
    }
    back() {
        this.goto((this.curIdx + this.info.length - 1) % this.info.length);
    }
}
