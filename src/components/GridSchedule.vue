<template>
    <div class="row no-gutters justify-content-start px-1 mb-3" :style="`width: ${display.width}%`">
        <div class="col-xs-auto">
            <div
                class="grid-container time"
                :style="{
                    'grid-template-columns': 'auto',
                    'grid-template-rows': `40px ${heightInfo.heights.join('px ')}px`
                }"
            >
                <div></div>
                <div v-for="hour in hours" :key="hour">{{ hour }}</div>
            </div>
        </div>
        <div class="col">
            <div
                class="grid-container main"
                :style="{
                    'grid-template-columns': gridTemplateCols,
                    'grid-template-rows': `48px ${heightInfo.heights.join('px ')}px`
                }"
            >
                <template v-if="status.isMobile">
                    <div v-for="day in days" :key="day" class="placeholder day">{{ day }}</div>
                </template>
                <template v-else>
                    <div v-for="day in daysFull" :key="day" class="placeholder day">
                        {{ day }}
                    </div>
                </template>
                <div v-for="idx in numRow * numCol" :key="idx" class="placeholder"></div>
                <!-- note: template element removes the need to wrap CourseBlock components in a HTML element -->
                <template v-for="(day, idx) in days">
                    <course-block
                        v-for="(scheduleBlock, _) in currentSchedule.days[+idx]"
                        :key="day + _"
                        :schedule-block="scheduleBlock"
                        :height-info="heightInfo.cumulativeHeights"
                        :absolute-earliest="absoluteEarliest"
                        :style="{
                            left: (+idx + scheduleBlock.left) * (100 / numCol) + '%',
                            width: (100 / numCol) * scheduleBlock.width + '%'
                        }"
                        :day="day"
                    ></course-block>
                </template>
            </div>
        </div>
    </div>
</template>

<script lang="ts" src="./GridSchedule.ts"></script>

<style scoped>
.grid-container {
    display: grid;
    grid-gap: 0px;
    padding: 0px;
}

.main {
    border-right: 0.7px solid #e5e3dc;
    border-bottom: 0.7px solid #e5e3dc;
}

.placeholder {
    font-size: 14px;
    border-left: 0.7px solid #e5e3dc;
    border-top: 0.7px solid #e5e3dc;
    text-align: center;
    z-index: 1;
}

.time > div {
    text-align: right;
    font-size: 10px;
}

.day {
    padding-top: 10px;
}
</style>
