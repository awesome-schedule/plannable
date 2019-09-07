<template>
    <div
        class="schedule mt-2"
        :style="{
            width: scheduleWidth + 'vw',
            'margin-left': (status.isMobile ? 11 : scheduleLeft) + 'vw'
        }"
    >
        <transition name="fade">
            <div
                v-if="noti.msg.length > 0"
                id="noti"
                v-top
                class="alert my-1 mx-auto"
                :class="`alert-${noti.cls}`"
                style="width: 85%"
            >
                <span v-html="noti.msg"></span>
                <button type="button" class="close" style="align:center" @click="noti.clear()">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
        </transition>

        <slot></slot>
        <div id="footer-link">
            <div class="row justify-content-between w-100">
                <div class="col-xs-auto pl-3 align-self-center" style="font-size: 1.1rem">
                    Get Connected With Us
                </div>
                <div class="col-xs-auto align-self-center">
                    <a
                        class="mr-5 link-btn"
                        target="_blank"
                        title="Checkout our GitHub site to watch/star/fork"
                        href="https://github.com/awesome-schedule/plannable/"
                    >
                        <i class="fab fa-github"></i>
                    </a>
                    <a
                        class="ml-4 mr-5 link-btn"
                        target="_blank"
                        title="File an issue on GitHub"
                        href="https://github.com/awesome-schedule/plannable/issues"
                    >
                        <i class="fas fa-exclamation-circle"></i>
                    </a>
                </div>
            </div>
        </div>
        <div id="footer-org">&copy;2019 —&nbsp;<strong>Plannable</strong></div>
    </div>
</template>
<style scoped>
#footer-link {
    background-color: #009688;
    color: white;
    padding: 20px;
}
#footer-org {
    background-color: #424242;
    color: white;
    padding: 8px;
    text-align: center;
    width: 100%;
}
.link-btn {
    color: inherit;
    text-decoration: none;
    font-size: 24px;
    margin-bottom: 3px;
}
</style>
<script lang="ts" src="./MainContent.ts"></script>
