<template>
    <div
        class="courseBlock"
        :class="{ 'block-strong': scheduleBlock.strong }"
        :style="{
            'margin-top': startPx + 'px',
            height: endPx - startPx + 'px',
            'background-color': scheduleBlock.background,
            color: scheduleBlock.foreground
        }"
        @click="showModal"
    >
        <template v-if="!status.isMobile">
            <div v-if="isSection" class="ml-2">
                <div class="mt-2" style="font-size:13px">
                    {{ firstSec.displayName }}
                </div>
                <div v-if="display.showInstructor" class="crs-info">
                    {{ firstSec.instructors.join(', ') }}
                </div>
                <div v-if="display.showRoom && room" class="crs-info">
                    {{ room }}
                </div>
                <template v-if="display.showTime">
                    <div v-for="meeting in firstSec.meetings" :key="meeting.days" class="crs-info">
                        {{ meeting.days }}
                    </div>
                </template>
            </div>
            <div v-if="isCourse" class="ml-2">
                <div class="mt-2" style="font-size:13px">
                    {{ firstSec.department }}
                    {{ firstSec.number }}-{{ firstSec.section }} +{{
                        scheduleBlock.section.sections.length - 1
                    }}
                    {{ firstSec.type }}
                </div>
                <template v-if="display.showTime">
                    <div v-for="meeting in firstSec.meetings" :key="meeting.days" class="crs-info">
                        {{ meeting.days }}
                    </div>
                </template>
                <div v-if="display.showInstructor" class="crs-info">
                    {{ firstSec.instructors.join(', ') }} and
                    {{
                        scheduleBlock.section.sections.reduce(
                            (acc, x) => acc + x.instructors.length,
                            0
                        ) - 1
                    }}
                    more
                </div>
                <div v-if="display.showRoom" class="crs-info">
                    {{ firstSec.meetings[0].room }} and
                    {{ scheduleBlock.section.sections.length - 1 }} more
                </div>
            </div>
            <div v-if="isEvent" class="ml-2">
                <div class="mt-2">
                    {{ scheduleBlock.section.title }}
                </div>
                <div class="crs-info">
                    {{ scheduleBlock.section.days }}<br />
                    {{ scheduleBlock.section.room }}
                </div>
                <div class="crs-info" v-html="scheduleBlock.section.description"></div>
            </div>
        </template>
        <template v-else class="mt-2 ml-2" style="font-size:10px">
            <div v-if="isSection">
                {{ firstSec.department }} <br />
                {{ firstSec.number }} <br />
                {{ firstSec.section }}
            </div>
            <div v-if="isCourse">
                {{ firstSec.department }} <br />
                {{ firstSec.number }} <br />
                {{ firstSec.section }} +{{ scheduleBlock.section.length - 1 }}
            </div>
            <div v-if="isEvent">
                {{ scheduleBlock.section.days }}
            </div>
        </template>
    </div>
</template>

<script lang="ts" src="./CourseBlock.ts"></script>

<style scoped>
.courseBlock {
    z-index: 2;
    color: white;
    cursor: pointer;
    overflow-y: hidden;
    overflow-x: hidden;
    position: absolute;
}

.block-strong {
    box-shadow: 0 4px 12px 4px rgba(0, 0, 0, 0.5);
}

.courseBlock:hover {
    box-shadow: 0 4px 12px 4px rgba(0, 0, 0, 0.5);
}

.crs-info {
    /* color: #eaeaea; */
    font-size: 11px;
}
</style>
