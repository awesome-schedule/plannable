import { Vue, Prop, Component } from 'vue-property-decorator';
export type StepperInfo = { title: string; src: string }[];

@Component
export default class Stepper extends Vue {
    @Prop(Array) info!: StepperInfo;
    // show the "next" and "back" button or not
    @Prop(Boolean) helper!: boolean;
    // always show title or show only when in current page
    @Prop(Boolean) alwaysTitle!: boolean;

    curItem = this.info.length ? this.info[0] : { title: '', src: '' };
    curIdx = 0;

    goto(idx: number) {
        this.curIdx = idx;
        this.$forceUpdate();
    }
    next() {
        const idx = (this.curIdx + 1) % this.info.length;
        this.curIdx = idx;
        this.goto(idx);
    }
    back() {
        const idx = (this.curIdx + this.info.length - 1) % this.info.length;
        this.curIdx = idx;
        this.goto(idx);
    }
}
