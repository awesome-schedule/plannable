import { Vue, Component, Prop } from 'vue-property-decorator';
@Component
export default class Pagination extends Vue {
    @Prop(Number) readonly scheduleLength!: number;
    @Prop(Number) readonly curIdx!: number;

    idx = 0;
    start = 0;
    goto = null;

    get length() {
        if (window.screen.width < 900) {
            return this.scheduleLength < 3 ? this.scheduleLength : 3;
        } else {
            return this.scheduleLength < 10 ? this.scheduleLength : 10;
        }
    }
    created() {
        this.autoSwitch();
    }
    updated() {
        this.autoSwitch();
    }
    updateStart() {
        if (this.idx < this.start) {
            this.start = this.idx;
        } else if (this.idx >= this.start + this.length) {
            this.start = this.idx - this.length + 1;
        }
    }
    switchPage(idx: number) {
        idx = +idx;
        if (idx >= 0 && idx < this.scheduleLength && !isNaN(idx)) {
            this.idx = idx;
            this.$emit('switch_page', this.idx);
        } else if (idx >= this.scheduleLength) {
            this.idx = this.scheduleLength - 1;
            this.$emit('switch_page', this.idx);
        } else if (idx < 0) {
            this.idx = 0;
            this.$emit('switch_page', this.idx);
        }
    }
    autoSwitch() {
        if (this.curIdx && this.curIdx >= 0 && this.curIdx < this.scheduleLength) {
            this.idx = this.curIdx;
            this.switchPage(this.idx);
            this.updateStart();
            this.$emit('switch_page', this.idx);
        }
    }
}
