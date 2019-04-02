<template>
    <nav class="mt-2">
        <ul class="pagination justify-content-center" style="margin-bottom: 0;">
            <li :class="'page-item' + (start <= 0 && idx <= start ? ' disabled' : '')">
                <a
                    class="page-link"
                    href="#"
                    tabindex="-1"
                    aria-disabled="true"
                    @click="switchPage(idx - 1)"
                    >Previous</a
                >
            </li>
            <li
                v-for="index in pageNumber"
                :key="index"
                :class="'page-item' + (idx === index - 1 + start ? ' active' : '')"
            >
                <a class="page-link" href="#" @click="switchPage(index + start - 1)">
                    {{ index + start }}
                    <span v-if="idx === index + end - 1" class="sr-only">(current)</span>
                </a>
            </li>
            <li
                :class="
                    'page-item' + (end >= indices.length - 1 && idx >= end - 1 ? ' disabled' : '')
                "
            >
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
            start: 0,
            end: e,
            pageNumber: e
        };
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
            if (idx >= this.start && idx < this.end) {
                this.idx = idx;
                this.$emit('switch_page', idx);
            } else if (idx < this.start && this.start > 0) {
                this.start -= 1;
                this.end -= 1;
                this.idx = idx;
                this.$emit('switch_page', idx);
            } else if (idx >= this.end && this.end < this.indices.length - 1) {
                this.start += 1;
                this.end += 1;
                this.idx = idx;
                this.$emit('switch_page', idx);
            }
        },
        autoSwitch() {
            if (
                this.curIdx !== undefined &&
                this.curIdx !== null &&
                this.curIdx >= 0 &&
                this.curIdx < this.indices.length
            ) {
                this.switchPage(this.curIdx);
            }
        }
    }
});
</script>
