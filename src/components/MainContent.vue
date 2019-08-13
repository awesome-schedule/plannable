<template>
    <div
        class="schedule mt-2"
        :style="{
            width: status.isMobile ? (scrollable ? '200%' : '85%') : scheduleWidth + 'vw',
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

        <div id="footer" class="container">
            <div class="row">
                <div class="col" style="text-align: left">Get Connected with us:</div>
                <div class="col" style="text-align: right">
                    <a
                        class="mx-3"
                        style="color:inherit;text-decoration: none;font-size:24px;margin-bottom:3px"
                        target="_blank"
                        title="Checkout our GitHub site to watch/star/fork"
                        href="https://github.com/awesome-schedule/plannable/"
                        ><i class="fab fa-github"></i
                    ></a>
                    <a
                        class="mx-5"
                        style="color:inherit;text-decoration: none;font-size:24px;margin-bottom:3px"
                        target="_blank"
                        title="File an issue on GitHub"
                        href="https://github.com/awesome-schedule/plannable/issues"
                        ><i class="fas fa-exclamation-circle"></i
                    ></a>
                </div>
            </div>
        </div>
        <div id="cr">&copy;2019 —&nbsp;<strong>Plannable</strong></div>
    </div>
</template>
<style scoped>
#footer {
    background-color: #019872;
    color: white;
    clear: both;
    padding: 20px;
}
#cr {
    background-color: grey;
    color: white;
    clear: both;
    padding: 7px;
    text-align: center;
}
</style>
<script lang="ts" src="./MainContent.ts"></script>
