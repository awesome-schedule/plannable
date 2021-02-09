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
            </div>
            <template v-if="status.isMobile">
                <template v-for="(day, i) in days">
                    <div
                        v-for="(block, j) in currentSchedule.days[i]"
                        :style="blockStyles[i][j]"
                        :key="day + j"
                        class="courseBlock"
                        :class="block.strong ? 'block-strong' : ''"
                        @click="showModal(block.section)"
                    >
                        <div style="font-size: 10px">{{ blockContent[i][j].title }}</div>
                    </div>
                </template>
            </template>
            <template v-else>
                <template v-for="(day, i) in days">
                    <div
                        v-for="(block, j) in currentSchedule.days[i]"
                        :style="blockStyles[i][j]"
                        :key="day + j"
                        class="courseBlock"
                        :class="block.strong ? 'block-strong' : ''"
                        @click="showModal(block.section)"
                    >
                        <div style="font-size: 13px">{{ blockContent[i][j].title }}</div>
                        <div>{{ blockContent[i][j].time }}</div>
                        <div>{{ blockContent[i][j].room }}</div>
                        <div>{{ blockContent[i][j].description }}</div>
                    </div>
                </template>
            </template>
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

.courseBlock {
    z-index: 2;
    color: white;
    cursor: pointer;
    overflow-y: hidden;
    overflow-x: hidden;
    position: absolute;
    text-shadow: 0px 0px 4px #555;
    font-size: 11px;
    padding-top: 0.25rem;
    padding-left: 0.25rem;
    /* text-shadow: -1px 0 #222, 0 1px black, 1px 0 black, 0 -1px black; */
}

.block-strong {
    box-shadow: 0 4px 12px 4px rgba(0, 0, 0, 0.5);
}

.courseBlock:hover {
    box-shadow: 0 4px 12px 4px rgba(0, 0, 0, 0.5);
}
</style>
