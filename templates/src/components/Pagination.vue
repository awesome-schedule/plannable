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
                v-for="index in indices.length < 10 ? indices.length : 10"
                :key="index"
                :class="'page-item' + (idx === index - 1 + start ? ' active' : '')"
            >
                <a class="page-link" href="#" @click="switchPage(index + start - 1)">
                    {{ index + start }}
                    <span v-if="idx === index + 9" class="sr-only">(current)</span>
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
        indices: Array
    },
    data() {
        return {
            idx: 0,
            start: 0,
            end: this.indices.length < 10 ? this.indices.length : 10
        };
    },
    methods: {
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
        }
    }
});
</script>
