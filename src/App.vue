<template>
    <div id="app" class="w-100" @change="saveStatus()">
        <version-modal :version="version"></version-modal>
        <course-modal
            :course="modal.course"
            :match="modal.match"
            :semester="semester.current"
        ></course-modal>
        <section-modal :semester="semester.current" :section="modal.section"></section-modal>
        <URL-modal :url="modal.url"></URL-modal>

        <nav class="tab-bar bg-light thin-scroll">
            <div
                class="tab-icon pt-4"
                :class="{ 'tab-icon-active': sideBar.showSelectClass }"
                title="Select Classes"
                @click="status.switchSideBar('showSelectClass')"
            >
                <i class="far fa-calendar-alt"></i>
            </div>
            <div
                class="tab-icon pt-4"
                :class="{ 'tab-icon-active': sideBar.showFuzzy }"
                title="Fuzzy Search"
                @click="status.switchSideBar('showFuzzy')"
            >
                <i class="fas fa-search"></i>
            </div>
            <div
                class="tab-icon pt-4"
                :class="{ 'tab-icon-active': sideBar.showEvent }"
                title="Edit Events"
                @click="status.switchSideBar('showEvent')"
            >
                <i class="fab fa-elementor"></i>
            </div>
            <div
                class="tab-icon pt-4"
                :class="{ 'tab-icon-active': sideBar.showFilter }"
                title="Filters"
                @click="status.switchSideBar('showFilter')"
            >
                <i class="fas fa-filter"></i>
            </div>
            <div
                class="tab-icon pt-4"
                :class="{ 'tab-icon-active': sideBar.showSetting }"
                title="Display Settings"
                @click="status.switchSideBar('showSetting')"
            >
                <i class="fas fa-cog"></i>
            </div>
            <div
                class="tab-icon pt-4"
                :class="{ 'tab-icon-active': sideBar.showSelectColor }"
                title="Customize Colors"
                @click="status.switchSideBar('showSelectColor')"
            >
                <i class="fas fa-palette"></i>
            </div>
            <div
                class="tab-icon pt-4"
                :class="{ 'tab-icon-active': sideBar.showExport }"
                title="Import/Export Schedule"
                @click="status.switchSideBar('showExport')"
            >
                <i class="fas fa-download"></i>
                <div
                    v-if="!profile.tokenType && profile.profiles.some(p => p.remote)"
                    class="badge text-warning"
                    style="position: absolute; top: 0.75rem; right: 0px; font-size: 14px"
                    title="Some profiles are marked as synced, but you've been logged out."
                >
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
            </div>
            <div
                title="Compare"
                :class="{ 'tab-icon-active': sideBar.showCompare }"
                class="tab-icon pt-4"
                @click="status.switchSideBar('showCompare')"
            >
                <i class="fas fa-balance-scale"></i>
            </div>
            <div
                v-if="display.enableLog"
                title="Show logs"
                :class="{ 'tab-icon-active': sideBar.showLog }"
                class="tab-icon pt-4"
                @click="status.switchSideBar('showLog')"
            >
                <i class="fas fa-stream"></i>
            </div>
            <div
                v-if="showInformation"
                title="Website guide and miscellaneous information"
                :class="{ 'tab-icon-active': sideBar.showInfo }"
                class="tab-icon pt-4"
                @click="status.switchSideBar('showInfo')"
            >
                <i class="fas fa-info-circle"></i>
            </div>
            <div
                title="Blank Page"
                :class="{ 'tab-icon-active': sideBar.showExternal }"
                class="tab-icon pt-4"
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
            <div id="pg" class="w-100 mb-2 row justify-content-center mt-1">
                <div v-if="schedule.generated" class="col-sm-auto text-center">
                    <Pagination></Pagination>
                </div>

                <date-separator
                    class="col-sm-auto text-center"
                    :cur-schedule="schedule.currentSchedule"
                    @update-select="schedule.currentSchedule.computeSchedule()"
                ></date-separator>

                <div v-if="schedule.generated" class="col-sm-auto text-center align-self-center">
                    <button class="btn btn-outline-primary" @click="addToCompare()">
                        <i class="fas fa-balance-scale"></i>
                        Compare
                        <i v-if="indexOfCompare() !== -1" class="fas fa-check"></i>
                    </button>
                </div>
            </div>

            <grid-schedule :schedule-days="schedule.currentSchedule.days"></grid-schedule>
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
    position: relative;
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
.thin-scroll {
    scrollbar-width: thin !important;
}
.thin-scroll::-webkit-scrollbar {
    width: 5px;
}
.thin-scroll::-webkit-scrollbar-thumb {
    width: 5px;
    background-color: #ccc;
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
.sidebar,
.sidebar .list-group-item:not(.list-group-item-action) {
    background-color: #f8f8f8;
}
.list-group-item-action {
    cursor: pointer;
}
.tab-bar {
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    z-index: 100; /* Behind the navbar */
    box-shadow: inset -1px 0 0 rgba(0, 0, 0, 0.1);
    width: 3vw;
    overflow-y: auto;
}
.nav-btn {
    border-radius: 0 !important;
    width: 100%;
    color: white !important;
}
@media print {
    @page {
        size: A4 portrait;
        page-break-before: avoid;
        margin: 0.8cm 0.8cm 0.8cm 0.8cm;
    }
    #pg {
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
        height: calc(100vw - 1.6cm) !important;
        margin: 0.8cm 0.8cm 0.8cm 0.8cm !important;
    }
    div #noti {
        display: none !important;
    }
    #footer-link {
        display: none !important;
    }
    #footer-org {
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
</style>
