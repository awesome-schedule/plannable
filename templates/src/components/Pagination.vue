<template>
    <nav class="mt-2">
        <ul class="pagination justify-content-center" style="margin-bottom: 0;">
            <li class="input-group" style="width:10vw">
                <!-- <div class="input-group-prepend">
                    <span class="input-group-text">Go To</span>
                </div> -->
                <input
                    v-model="goto"
                    type="number"
                    placeholder="Go to"
                    class="form-control"
                    style="border-radius: 4px 0px 0px 4px !important"
                    @input="switchPage(goto - 1)"
                />
            </li>
            <li :class="'page-item' + (start <= 0 && idx <= start ? ' disabled' : '')">
                <a
                    class="page-link"
                    href="#"
                    tabindex="-1"
                    aria-disabled="true"
                    @click="switchPage(idx - 1)"
                    >Prev</a
                >
            </li>
            <li
                v-for="index in length"
                :key="index"
                :class="'page-item' + (idx === index - 1 + start ? ' active' : '')"
            >
                <a class="page-link" href="#" @click="switchPage(index + start - 1)">
                    {{ index + start }}
                    <span v-if="idx === index + end - 1" class="sr-only">(current)</span>
                </a>
            </li>
            <li :class="'page-item' + (idx >= indices.length - 1 ? ' disabled' : '')">
                <a class="page-link" href="#" @click="switchPage(idx + 1)">Next</a>
            </li>
        </ul>
    </nav>
</template>

<script>
import Vue from 'vue';
export default Vue.extend({
    props: {
        /**
         * @type {number[]}
         */
        indices: Array,
        curIdx: Number
    },
    data() {
        let e = 10;
        if (window.screen.width < 900) {
            e = 3;
        }
        if (this.indices.length < e) {
            e = this.indices.length;
        }
        return {
            idx: 0,
            // start: 0,
            end: e,
            pageNumber: e,
            goto: null
        };
    },
    computed: {
        length() {
            if (window.screen.width < 900) {
                return this.indices.length < 3 ? this.indices.length : 3;
            } else {
                return this.indices.length < 10 ? this.indices.length : 10;
            }
        },
        start() {
            if (idx < this.length / 2) {
                return 0;
            } else if (this.indices - idx - 1 < this.length / 2) {
                return this.indices.length - this.length;
            } else {
                return idx - this.length / 2;
            }
        }
    },
    created() {
        this.autoSwitch();
    },
    updated() {
        this.autoSwitch();
    },
    methods: {
        /**
         * @param {number}
         */
        switchPage(idx) {
            if (idx < 0 || idx >= this.indices || isNaN(idx)) return;
            idx = parseInt(idx);
            if (idx >= this.start && idx < this.end) {
                this.idx = idx;
                this.$emit('switch_page', idx);
            } else if (idx === this.start - 1 && this.start > 0) {
                this.start -= 1;
                this.end -= 1;
                this.idx = idx;
                this.$emit('switch_page', idx);
            } else if (idx === this.end && this.end < this.indices.length) {
                this.start += 1;
                this.end += 1;
                this.idx = idx;
                this.$emit('switch_page', idx);
            } else if (idx < this.start - 1 && this.start > 0) {
                this.end -= this.start - this.idx;
                this.start = idx;
                this.idx = idx;
                this.$emit('switch_page', idx);
            } else if (idx > this.end && this.end < this.indices.length) {
                this.idx = idx;
                this.start += idx - this.end + 1;
                this.end = idx + 1;
                this.$emit('switch_page', idx);
            }
        },
        autoSwitch() {
            if (this.curIdx && this.curIdx >= 0 && this.curIdx < this.indices.length) {
                // if (this.curIdx >= this.start && this.curIdx < this.start + this.length) {
                //     this.switchPage(this.curIdx);
                // } else if(this.curIdx < this.length / 2){

                //     this.start = this.curIdx - this.length < 0 ? 0 : this.curIdx - this.pageNumber;
                //     this.switchPage(this.curIdx);
                // }
                this.idx = this.curIdx;
                this.switchPage(this.idx);
            }
        }
    }
});
</script>
