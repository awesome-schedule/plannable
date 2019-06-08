<template>
    <div id="app" class="w-100" @change="saveStatus()">
        <course-modal :course="modal.course"></course-modal>
        <section-modal
            :semester="semester.currentSemester"
            :section="modal.section"
        ></section-modal>

        <nav
            class="tab-bar bg-light"
            :style="{
                width: sideBarWidth + 'vw'
            }"
        >
            <div
                class="tab-icon mt-0 mb-1"
                :class="{ 'tab-icon-active': sideBar.showSelectClass }"
                title="Select Classes"
                @click="status.switchSideBar('showSelectClass')"
            >
                <i class="far fa-calendar-alt"></i>
            </div>
            <div
                class="tab-icon mt-0 mb-4"
                :class="{ 'tab-icon-active': sideBar.showFuzzy }"
                title="Fuzzy Search"
                @click="status.switchSideBar('showFuzzy')"
            >
                <span style="font-size: 10px;" class="badge badge-info">Beta</span>
                <i class="fas fa-search"></i>
            </div>
            <div
                class="tab-icon mt-0 mb-4"
                :class="{ 'tab-icon-active': sideBar.showEvent }"
                title="Edit Events"
                @click="status.switchSideBar('showEvent')"
            >
                <i class="fab fa-elementor"></i>
            </div>
            <div
                class="tab-icon mt-0 mb-4"
                :class="{ 'tab-icon-active': sideBar.showFilter }"
                title="Filters"
                @click="status.switchSideBar('showFilter')"
            >
                <i class="fas fa-filter"></i>
            </div>
            <div
                class="tab-icon mt-0 mb-4"
                :class="{ 'tab-icon-active': sideBar.showSetting }"
                title="Display Settings"
                @click="status.switchSideBar('showSetting')"
            >
                <i class="fas fa-cog"></i>
            </div>
            <div
                class="tab-icon mt-0 mb-4"
                :class="{ 'tab-icon-active': sideBar.showSelectColor }"
                title="Customize Colors"
                @click="status.switchSideBar('showSelectColor')"
            >
                <i class="fas fa-palette"></i>
            </div>
            <div
                class="tab-icon mt-0 mb-4"
                :class="{ 'tab-icon-active': sideBar.showExport }"
                title="Import/Export Schedule"
                @click="status.switchSideBar('showExport')"
            >
                <i class="fas fa-download"></i>
            </div>
            <div
                title="Show logs"
                :class="{ 'tab-icon-active': sideBar.showLog }"
                class="tab-icon mb-4"
                @click="status.switchSideBar('showLog')"
            >
                <i class="fas fa-stream"></i>
            </div>
            <div
                title="Website guide and miscellaneous information"
                :class="{ 'tab-icon-active': sideBar.showInfo }"
                class="tab-icon mb-4"
                @click="status.switchSideBar('showInfo')"
            >
                <i class="fas fa-info-circle"></i>
            </div>
            <div
                title="Blank Page"
                :class="{ 'tab-icon-active': sideBar.showExternal }"
                class="tab-icon mb-4"
                @click="status.switchSideBar('showExternal')"
            >
                <i class="fas fa-bullhorn"></i>
            </div>
        </nav>

        <class-view v-if="sideBar.showSelectClass"></class-view>

        <fuzzy-view v-else-if="sideBar.showFuzzy"> </fuzzy-view>

        <event-view v-else-if="sideBar.showEvent"> </event-view>

        <filter-view v-else-if="sideBar.showFilter"></filter-view>

        <display-view v-else-if="sideBar.showSetting"></display-view>

        <export-view v-else-if="sideBar.showExport"></export-view>

        <palette-view v-else-if="sideBar.showSelectColor"></palette-view>

        <information v-else-if="sideBar.showInfo" :schedule-left="scheduleLeft"></information>

        <external
            v-else-if="sideBar.showExternal"
            :style="{ 'margin-left': sideBarWidth + 1 + 'vw' }"
        ></external>

        <log-view v-else-if="sideBar.showLog"></log-view>

        <transition name="fade">
            <div
                v-if="noti.msg.length > 0"
                id="noti"
                v-top
                class="alert mt-1 mb-0"
                :class="`alert-${noti.cls}`"
                :style="
                    `width:${mobile ? 'auto' : scheduleWidth - 10 + 'vw'}; margin-left:${
                        mobile ? '11' : scheduleLeft + 5
                    }vw;`
                "
            >
                {{ noti.msg }}
                <button type="button" class="close" style="align:center" @click="noti.clear()">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
        </transition>

        <div
            v-if="!sideBar.showInfo && !sideBar.showExternal"
            class="schedule"
            :style="{
                width: mobile ? (scrollable ? '200%' : '85%') : scheduleWidth + 'vw',
                'margin-left': (mobile ? 11 : scheduleLeft) + 'vw'
            }"
        >
            <div class="w-100 my-3">
                <div class="row justify-content-center">
                    <div class="col">
                        <Pagination></Pagination>
                    </div>
                </div>
            </div>
            <grid-schedule></grid-schedule>

            <v-footer id="app-footer" dark height="auto" class="w-100">
                <v-card class="flex w-100" flat tile>
                    <v-card-title class="teal py-3">
                        <strong class="subheading mr-auto"
                            >Get connected with us and let us hear your voice!
                        </strong>
                        <a
                            style="color:inherit;text-decoration: none;"
                            target="_blank"
                            href="https://github.com/awesome-schedule/Awesome-SchedulAR"
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
                            href="https://github.com/awesome-schedule/Awesome-SchedulAR/issues"
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
                            <v-btn
                                class="mx-3"
                                title="Fill out a survey to make us better"
                                dark
                                icon
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
    </div>
</template>

<script lang="ts" src="./App.ts"></script>

<style>
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.4s;
}
.fade-enter, .fade-leave-to /* .fade-leave-active below version 2.1.8 */ {
    opacity: 0;
}
.tab-icon {
    text-align: center;
    font-size: 1.8vw;
    color: #888888;
}
.tab-icon:hover {
    color: #444444;
}
.tab-icon:active {
    color: #bbbbbb;
}
.tab-icon-active {
    color: black;
}

.click-icon {
    cursor: pointer;
}
.click-icon:hover {
    color: #6f6f6f;
}
.click-icon:active {
    color: #cbcbcb;
}
.icon-disabled {
    color: #999999;
}

.sidebar-nocolMobile {
    position: fixed;
    top: 0;
    bottom: 0;
    z-index: 100; /* Behind the navbar */
    box-shadow: inset -1px 0 0 rgba(0, 0, 0, 0.1);
    overflow-y: auto;
    left: 3vw !important;
    width: 100% !important;
    scrollbar-width: thin !important;
}
.sidebar-nocol,
.sidebar {
    position: fixed;
    top: 0;
    bottom: 0;
    z-index: 100; /* Behind the navbar */
    box-shadow: inset -1px 0 0 rgba(0, 0, 0, 0.1);
    overflow-y: auto;
    left: 3vw !important;
    width: 19vw !important;
    scrollbar-width: thin !important;
}

.sidebar .list-group-item {
    background-color: #f8f8f8;
}

.tab-bar {
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    z-index: 100; /* Behind the navbar */
    padding: 26px 0 0;
    box-shadow: inset -1px 0 0 rgba(0, 0, 0, 0.1);
}

.nav-btn {
    border-radius: 0 !important;
    width: 100%;
    color: white !important;
}

.sort-option {
    cursor: pointer;
}

@media print {
    @page {
        size: A4 portrait;
        page-break-before: avoid;
        margin: 0.8cm 0.8cm 0.8cm 0.8cm;
    }
    nav {
        display: none !important;
    }
    .tab-bar {
        display: none !important;
    }
    div .schedule {
        width: calc(100vw - 1.6cm) !important;
        height: calc(100vw - 0.8cm) !important;
        margin: 0 0.8cm 0.8cm 0.8cm !important;
    }
    div #noti {
        display: none !important;
    }
    #app-footer {
        display: none !important;
    }
}

@media (max-width: 600px) {
    .sidebar,
    .sidebar-nocol {
        left: 10vw !important;
        width: 75vw !important;
    }

    .tab-icon {
        font-size: 6vw;
        margin-left: 20%;
        color: #5e5e5e;
    }

    .tab-icon-active {
        color: #1f1f1f;
    }
}

.sidebar::-webkit-scrollbar,
.sidebar-nocol::-webkit-scrollbar {
    width: 5px;
}

.sidebar::-webkit-scrollbar-thumb,
.sidebar-nocol::-webkit-scrollbar-thumb {
    width: 5px;
    background-color: #ccc;
}

.btn-days {
    width: 100%;
}

.btn-days .btn {
    border-radius: 0;
    padding: 0.25rem 0.25rem;
}

/* Vuetify has overriden this, which is very annoying */
[type='number'] {
    width: inherit !important;
}
</style>
