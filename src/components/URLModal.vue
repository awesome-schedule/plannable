<template>
    <div id="url-modal" class="modal fade" tabindex="-1" role="dialog">
        <div class="modal-dialog modal-lg" role="document">
            <div class="modal-content">
                <div class="modal-header">
                    <h4 class="modal-title">URL Sharing</h4>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div class="modal-body">
                    <textarea
                        id="url-text"
                        v-model="url"
                        rows="10"
                        style="width: 100%"
                        class="form-control"
                    ></textarea>
                    <button
                        id="copy-url-btn"
                        class="btn btn-primary px-3 mt-3"
                        data-toggle="popover"
                        data-content="success"
                        @click="copy()"
                    >
                        Copy
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import $ from 'jquery';
import 'bootstrap';
import Vue from 'vue';
export default Vue.extend({
    props: {
        url: String
    },
    mounted() {
        $('#copy-url-btn');
        // this.copy();
    },
    methods: {
        copy() {
            const box = document.getElementById('url-text') as HTMLTextAreaElement; // this.$refs.url as HTMLTextAreaElement;
            box.focus();
            box.select();
            const succ = document.execCommand('copy');
            if (!succ) console.error('unsuccessful copy');
            else $('#copy-url-btn').popover('show');
            window.setTimeout(() => $('#copy-url-btn').popover('hide'), 2000);
        }
    }
});
</script>
