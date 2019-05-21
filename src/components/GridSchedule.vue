<template>
    <table style="width:100%">
        <tr>
            <td style="width:3.5%">
                <div
                    class="grid-container time mb-3"
                    :style="{
                        'grid-template-columns': 'auto',
                        width: '100%',
                        height: mainHeight,
                        'grid-template-rows': heightInfo.reduce(
                            (acc, x) => acc + (x + 'px '),
                            '35px '
                        )
                    }"
                >
                    <div></div>
                    <div v-for="(hour, i) in hours" :key="i">{{ hour }}</div>
                </div>
            </td>
            <td>
                <div
                    id="grid"
                    class="grid-container main mb-3"
                    :style="{
                        'grid-template-columns': '20% 20% 20% 20% 20%',
                        position: 'relative',
                        'grid-template-rows': heightInfo.reduce(
                            (acc, x) => acc + (x + 'px '),
                            '48px '
                        ),
                        height: mainHeight
                    }"
                >
                    <div class="placeholder day">{{ mon }}</div>
                    <div class="placeholder day">{{ tue }}</div>
                    <div class="placeholder day">{{ wed }}</div>
                    <div class="placeholder day">{{ thu }}</div>
                    <div class="placeholder day">{{ fri }}</div>
                    <div
                        v-for="(item, i) in items"
                        :key="i"
                        class="placeholder"
                        style="z-index:1"
                    ></div>
                    <!-- note: template element removes the need to wrap CourseBlock components in a HTML element -->
                    <template v-for="(day, idx) in days">
                        <course-block
                            v-for="(scheduleBlock, _) in schedule.days[day]"
                            :key="day + _"
                            :schedule-block="scheduleBlock"
                            :height-info="heightInfo"
                            :absolute-earliest="absoluteEarliest"
                            :style="{
                                left: (idx + scheduleBlock.left) * 20 + '%',
                                width: 20 * scheduleBlock.width + '%'
                            }"
                            :day="day"
                        ></course-block>
                    </template>
                </div>
            </td>
        </tr>
    </table>
</template>

<script lang="ts" src="./GridSchedule.ts"></script>

<style scoped>
.grid-container {
    display: grid;
    grid-gap: 0px;
    background-color: white;
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
}

.time > div {
    text-align: right;
    font-size: 10px;
}

.item1 {
    grid-column: 1 / 3;
}

.day {
    padding-top: 10px;
}
</style>
