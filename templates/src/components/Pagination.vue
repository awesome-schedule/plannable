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
                    @input="
                        switchPage(goto - 1);
                        updateStart();
                    "
                />
            </li>
            <li :class="'page-item' + (start <= 0 && idx <= start ? ' disabled' : '')">
                <a
                    class="page-link"
                    href="#"
                    tabindex="-1"
                    aria-disabled="true"
                    @click="
                        switchPage(idx - 1);
                        updateStart();
                    "
                    >Prev</a
                >
            </li>
            <li
                v-for="index in length"
                :key="index"
                :class="'page-item' + (idx === index - 1 + start ? ' active' : '')"
            >
                <a
                    class="page-link"
                    href="#"
                    @click="
                        switchPage(index + start - 1);
                        updateStart();
                    "
                >
                    {{ index + start }}
                </a>
            </li>
            <li :class="'page-item' + (idx >= indices.length - 1 ? ' disabled' : '')">
                <a
                    class="page-link"
                    href="#"
                    @click="
                        switchPage(idx + 1);
                        updateStart();
                    "
                    >Next</a
                >
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
            start: 0,
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
        }
    },
    created() {
        this.autoSwitch();
    },
    updated() {
        this.autoSwitch();
    },
    methods: {
        updateStart() {
            if (this.idx < this.start) {
                this.start = this.idx;
            } else if (this.idx >= this.start + this.length) {
                this.start = this.idx - this.length + 1;
            }
        },
        /**
         * @param {number}
         */
        switchPage(idx) {
            if (idx >= 0 && idx < this.indices.length && !isNaN(idx)) {
                this.idx = parseInt(idx);
                this.$emit('switch_page', this.idx);
            }
        },
        autoSwitch() {
            if (this.curIdx && this.curIdx >= 0 && this.curIdx < this.indices.length) {
                this.idx = this.curIdx;
                this.switchPage(this.idx);
                this.updateStart();
                this.$emit('switch_page', this.idx);
            }
        }
    }
});
</script>
