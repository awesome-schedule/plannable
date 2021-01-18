<template>
    <div>
        <nav class="bg-light sidebar">
            <div class="btn bg-info nav-btn">Compare Schedules</div>
            <ul v-if="compare.length > 0" class="list-group list-group-flush mx-1">
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
                        <div class="col-sm-auto mr-1 align-self-center">
                            <button
                                title="if you want your schedule to be as similar to this schedule as possible, click me"
                                @click="similarity(idx)"
                            >
                                Ref
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
            <div v-else class="mx-4 my-2">
                You haven't selected any schedule to compare yet. Select one by clicking the
                "Compare" button at the top of the page when you have generated some schedules. You
                can also compare generated schedules across different profiles.
            </div>
            <div class="btn bg-info nav-btn">Sort by Similarity to Another Schedule</div>
            <div v-if="filter.similarityEnabled" class="mx-2 my-2 text-center">
                <pre class="mb-2 text-left mx-1">{{ refSchedule }}</pre>
                <button
                    type="button"
                    class="btn btn-outline-info"
                    @click="renderSimilarityRefSchedule()"
                >
                    {{ similarityRefShown ? 'Hide' : 'Display' }} Reference Schedule
                </button>
            </div>
            <div v-else class="mx-2 my-2 text-center">
                Select "Ref" for any schedule in the compare list to enable sort by similarity with
                reference to the selected schedule.
            </div>
        </nav>
        <main-content>
            <grid-schedule :current-schedule="compareSchedule"></grid-schedule>
        </main-content>
    </div>
</template>
<script lang="ts" src="./CompareView.ts"></script>
