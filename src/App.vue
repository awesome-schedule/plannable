<template>
    <div id="app" class="w-100" @change="saveStatus()">
        <div
            id="versionModal"
            class="modal fade"
            tabindex="-1"
            role="dialog"
            @focus="refreshNote()"
        >
            <div class="modal-dialog modal-lg" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 id="exampleModalLabel" class="modal-title">Release v{{ version }}</h5>
                        <button type="button" class="close" data-dismiss="modal">
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>
                    <div id="release-note-body" class="mx-4 my-4">
                        {{ note }}
                    </div>
                </div>
            </div>
        </div>
        <course-modal :course="modal.course" :match="modal.match"></course-modal>
        <section-modal
            :semester="semester.currentSemester"
            :section="modal.section"
        ></section-modal>
        <URL-modal :url="modal.url"></URL-modal>

        <nav class="tab-bar bg-light">
            <div
                class="tab-icon mt-0 mb-4"
                :class="{ 'tab-icon-active': sideBar.showSelectClass }"
                title="Select Classes"
                @click="status.switchSideBar('showSelectClass')"
            >
                <i class="far fa-calendar-alt"></i>
            </div>
            <div
                v-if="display.enableFuzzy"
                class="tab-icon mt-0 mb-4"
                :class="{ 'tab-icon-active': sideBar.showFuzzy }"
                title="Fuzzy Search"
                @click="status.switchSideBar('showFuzzy')"
            >
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
                title="Compare"
                :class="{ 'tab-icon-active': sideBar.showCompare }"
                class="tab-icon mb-4"
                @click="status.switchSideBar('showCompare')"
            >
                <i class="fas fa-balance-scale"></i>
            </div>
            <div
                v-if="display.enableLog"
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

        <compare-view v-else-if="sideBar.showCompare"></compare-view>

        <information v-else-if="sideBar.showInfo"></information>

        <external v-else-if="sideBar.showExternal"></external>

        <log-view v-else-if="sideBar.showLog"></log-view>

        <main-content v-if="!sideBar.showInfo && !sideBar.showExternal && !sideBar.showCompare">
            <div id="pg" class="w-100 mb-2 row justify-content-center">
                <div v-if="schedule.generated" class="col-sm-auto text-center my-1">
                    <Pagination></Pagination>
                </div>
                <div
                    v-if="schedule.currentSchedule.dateSeparators.length > 2"
                    class="col-sm-auto text-center my-1"
                >
                    <date-separator :cur-schedule="schedule.currentSchedule"></date-separator>
                </div>
                <div v-if="schedule.generated" class="col-sm-auto text-center align-self-center">
                    <button class="btn btn-outline-primary my-1" @click="addToCompare()">
                        <i class="fas fa-balance-scale"></i>
                        Compare
                        <i v-if="indexOfCompare() !== -1" class="fas fa-check"></i>
                    </button>
                </div>
            </div>

            <grid-schedule :current-schedule="schedule.currentSchedule"></grid-schedule>
        </main-content>
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
.sidebar {
    position: fixed;
    top: 0;
    bottom: 0;
    z-index: 100; /* Behind the navbar */
    box-shadow: inset -1px 0 0 rgba(0, 0, 0, 0.1);
    overflow-y: auto;
    left: 3vw;
    width: 19vw;
    scrollbar-width: thin !important;
}
.sidebar .list-group-item:not(.list-group-item-action) {
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
    width: 3vw;
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
    #pagination-container {
        display: none !important;
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
    .tab-bar {
        width: 10vw;
    }
    .sidebar {
        left: 10vw;
        width: 90vw;
    }
    .tab-icon {
        font-size: 6vw;
        color: #5e5e5e;
    }
    .tab-icon-active {
        color: #1f1f1f;
    }
}
.sidebar::-webkit-scrollbar {
    width: 5px;
}
.sidebar::-webkit-scrollbar-thumb {
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
