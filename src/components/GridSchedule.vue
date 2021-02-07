<template>
    <div
        class="row no-gutters justify-content-start px-1 mb-3"
        :style="{ width: display.width + '%' }"
    >
        <div class="col-xs-auto time">
            <div
                v-for="(hour, idx) in hours"
                :key="hour"
                :style="`top: ${heights.sumHeights[idx] - 5}px`"
            >
                {{ hour }}
            </div>
        </div>
        <div class="col">
            <div
                class="grid-container"
                :style="{
                    'grid-template-columns': `${100 / this.numCol}% `.repeat(this.numCol),
                    'grid-template-rows': `${heights.heights.join('px ')}px`
                }"
            >
                <div v-for="day in days" :key="day" class="day-cell">
                    {{ day }}
                </div>
                <div v-for="idx in numRow * numCol" :key="idx" class="placeholder"></div>
                <!-- note: template element removes the need to wrap CourseBlock components in a HTML element -->
                <template v-for="(day, i) in days">
                    <course-block
                        v-for="(scheduleBlock, j) in currentSchedule.days[i]"
                        :key="day + j"
                        :schedule-block="scheduleBlock"
                        :style="blockStyles[i][j]"
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

.day-cell {
    z-index: 1;
    font-size: 14px;
    border-left: 0.5px solid #e5e3dc;
    border-right: 0.5px solid #e5e3dc;
    border-top: 1px solid #e5e3dc;
    border-bottom: 1px solid #e5e3dc;
    text-align: center;
    padding-top: 10px;
}

.placeholder {
    z-index: 1;
    border-left: 0.5px solid #e5e3dc;
    border-right: 0.5px solid #e5e3dc;
    border-bottom: 1px solid #e5e3dc;
}

.time {
    text-align: right;
    font-size: 10px;
    width: 24px;
    position: relative;
}

.time > div {
    position: absolute;
}
</style>
