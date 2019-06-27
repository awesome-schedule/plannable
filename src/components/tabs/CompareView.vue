<template>
    <div>
        <nav class="bg-light sidebar">
            <div class="btn bg-info nav-btn">
                Compare Schedules
            </div>
            <ul class="list-group list-group-flush mx-1">
                <li v-if="number === 0" class="list-group-item">
                    You haven't selected any schedule to compare yet. Select one by clicking the
                    "add to compare" button at at the botton of the page.
                </li>
                <li v-for="(color, idx) in colors" :key="color" class="list-group-item">
                    <div class="form-row no-gutters justify-content-between">
                        <div class="col-10">
                            Schedule {{ idx + 1 }}<br />
                            <small> {{ compare[idx].time }} </small><br />
                            <small> {{ compare[idx].semester }} </small>
                        </div>
                        <div class="col-1">
                            <div
                                :style="'background-color:' + color + ';height:20px;width:20px'"
                            ></div>
                        </div>
                        <div class="col-1">
                            <i
                                class="fa fa-times ml-1 click-icon"
                                title="delete this schedule"
                                @click="deleteCompare(idx)"
                            ></i>
                        </div>
                    </div>
                </li>
            </ul>
        </nav>
        <div
            class="schedule mt-3"
            :style="{
                width: status.isMobile ? '85%' : scheduleWidth + 'vw',
                'margin-left': (status.isMobile ? 11 : scheduleLeft) + 'vw' // fixed margin for mobile
            }"
        >
            <grid-schedule :current-schedule="compareSchedule"></grid-schedule>
        </div>
    </div>
</template>
<script lang="ts" src="./CompareView.ts"></script>
