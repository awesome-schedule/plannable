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
        @click="showModal()"
    >
        <template v-if="!status.isMobile">
            <div v-if="isSection" class="ml-2">
                <div class="mt-2" style="font-size:13px">
                    {{
                        display.showSuffix
                            ? firstSec.displayName
                            : `${firstSec.department} ${firstSec.number}-${firstSec.section}`
                    }}
                </div>
                <div v-if="display.showInstructor" :style="style">
                    {{ firstSec.instructors.join(', ') }}
                </div>
                <div v-if="display.showRoom && room" :style="style">
                    {{ room }}
                </div>
                <template v-if="display.showTime">
                    <div v-for="meeting in firstSec.meetings" :key="meeting.days" :style="style">
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
                    <div v-for="meeting in firstSec.meetings" :key="meeting.days" :style="style">
                        {{ meeting.days }}
                    </div>
                </template>
                <div v-if="display.showInstructor" :style="style">
                    {{ firstSec.instructors.join(', ') }} and
                    {{
                        scheduleBlock.section.sections.reduce(
                            (acc, x) => acc + x.instructors.length,
                            0
                        ) - 1
                    }}
                    more
                </div>
                <div v-if="display.showRoom" :style="style">
                    {{ firstSec.meetings[0].room }} and
                    {{ scheduleBlock.section.sections.length - 1 }} more
                </div>
            </div>
            <div v-if="isEvent" class="ml-2">
                <div class="mt-2">
                    {{ scheduleBlock.section.title }}
                </div>
                <div :style="style">
                    {{ scheduleBlock.section.days }}<br />
                    {{ scheduleBlock.section.room }}
                </div>
                <div :style="style" v-html="scheduleBlock.section.description"></div>
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
</style>
