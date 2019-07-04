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
                {{ noti.msg }}
                <button type="button" class="close" style="align:center" @click="noti.clear()">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
        </transition>

        <slot></slot>

        <v-footer id="app-footer" dark height="auto" class="w-100">
            <v-card class="flex w-100" flat tile>
                <v-card-title class="teal py-3">
                    <strong class="subheading mr-auto"
                        >Get connected with us and let us hear your voice!
                    </strong>
                    <a
                        style="color:inherit;text-decoration: none;"
                        target="_blank"
                        href="https://github.com/awesome-schedule/plannable"
                    >
                        <v-btn
                            class="mx-3"
                            title="Checkout our GitHub site to watch/star/fork!"
                            dark
                            icon
                        >
                            <v-icon size="24px">fab fa-github</v-icon>
                        </v-btn>
                    </a>

                    <a
                        style="color:inherit;text-decoration: none;"
                        target="_blank"
                        href="https://github.com/awesome-schedule/plannable/issues"
                    >
                        <v-btn class="mx-3" title="File an issue on GitHub" dark icon>
                            <v-icon size="24px">fas fa-exclamation-circle</v-icon>
                        </v-btn>
                    </a>
                    <a
                        style="color:inherit;text-decoration: none;"
                        target="_blank"
                        href="https://www.youtube.com/watch?v=GFKAmRvqwkg"
                    >
                        <v-btn class="mx-3" title="Watch our video on YouTube" dark icon
                            ><v-icon size="22px">fab fa-youtube</v-icon>
                        </v-btn>
                    </a>
                    <a
                        style="color:inherit;text-decoration: none;"
                        target="_blank"
                        href="https://docs.google.com/forms/d/e/1FAIpQLScsXZdkFFIljwyhuyAOwjGhEbq_LzY-POxEyJsK_jLrBIUmvw/viewform"
                    >
                        <v-btn class="mx-3" title="Fill out a survey to make us better" dark icon
                            ><v-icon size="24px">fas fa-poll</v-icon>
                        </v-btn>
                    </a>
                </v-card-title>

                <v-card-actions class="grey darken-3 justify-content-center">
                    &copy;2019 —&nbsp;<strong>Plannable</strong>
                </v-card-actions>
            </v-card>
        </v-footer>
    </div>
</template>

<script lang="ts" src="./MainContent.ts"></script>
