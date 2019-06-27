<template>
    <div>
        <nav class="bg-light sidebar">
            <div class="btn bg-info nav-btn">
                Compare Schedules
            </div>
            <ul class="list-group list-group-flush mx-1">
                <li v-for="(color, idx) in colors" :key="color" class="list-group-item">
                    <table>
                        <tr>
                            <td>Schedule {{ idx }}:</td>
                            <td
                                :style="'background-color:' + color + ';height:20px;width:20px'"
                            ></td>
                        </tr>
                    </table>
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
