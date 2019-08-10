<template>
    <div>
        <nav class="bg-light sidebar">
            <div class="btn bg-info nav-btn">
                Compare Schedules
            </div>
            <ul class="list-group list-group-flush mx-1">
                <li v-if="compare.length === 0" class="list-group-item">
                    You haven't selected any schedule to compare yet. Select one by clicking the
                    "Compare" button at the top of the page when you have generated some schedules.
                    You can also compare generated schedules across different profiles.
                </li>
                <li
                    v-for="(cur, idx) in compare"
                    :key="cur"
                    class="list-group-item px-1"
                    @mouseenter="highlight(idx)"
                    @mouseleave="highlight(idx)"
                >
                    <div class="row no-gutters justify-content-between">
                        <div class="col-sm-auto mr-auto" :title="getTitle(idx)">
                            Schedule {{ cur.pIdx + 1 }}/{{ cur.index + 1 }}<br />
                            <small class="text-muted">Profile "{{ cur.profileName }}"</small><br />
                        </div>
                        <div
                            class="col-sm-3 mx-auto align-self-center"
                            title="if you want your schedule to be as similar to this schedule as possible, click this and select 'similarity' in filters"
                        >
                            <button @click="similarity(idx)">
                                Preferred
                                <i v-if="isSimilarSchedule(idx)" class="far fa-check-square"></i>
                                <i v-else class="far fa-square"></i>
                            </button>
                        </div>
                        <div class="col-sm-auto text-right align-self-center">
                            <input
                                v-model="cur.color"
                                style="width: 25px"
                                type="color"
                                class="mr-1"
                                @change="renderSchedule()"
                            />
                            <i
                                class="fas fa-sync-alt click-icon"
                                title="get a random color"
                                @click="randColor(idx)"
                            ></i>
                            <i
                                class="fa fa-times ml-2 click-icon"
                                style="font-size: 16px"
                                title="delete this schedule"
                                @click="deleteCompare(idx)"
                            ></i>
                        </div>
                    </div>
                </li>
            </ul>
        </nav>
        <main-content>
            <grid-schedule :current-schedule="compareSchedule"></grid-schedule>
        </main-content>
    </div>
</template>
<script lang="ts" src="./CompareView.ts"></script>
