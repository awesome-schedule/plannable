<template>
    <div
        class="courseBlock"
        :class="scheduleBlock.strong ? 'block-strong' : ''"
        @click="showModal()"
    >
        <template v-if="!status.isMobile">
            <div v-if="isSection(section)" class="ml-2">
                <div class="mt-2" style="font-size: 13px">
                    {{
                        display.showSuffix
                            ? section.displayName
                            : `${section.department} ${section.number}-${section.section}`
                    }}
                </div>
                <div v-if="display.showInstructor" class="cb-item">
                    {{ section.instructors.join(', ') }}
                </div>
                <div v-if="display.showRoom && room" class="cb-item">
                    {{ room }}
                </div>
                <template v-if="display.showTime">
                    <div v-for="meeting in section.meetings" :key="meeting.days" class="cb-item">
                        {{ meeting.days }}
                    </div>
                </template>
            </div>
            <div v-else-if="isCourse(section)" class="ml-2">
                <div class="mt-2" style="font-size: 13px">
                    {{ firstSec.department }}
                    {{ firstSec.number }}-{{ firstSec.section }} +{{ section.sections.length - 1 }}
                    {{ firstSec.type }}
                </div>
                <template v-if="display.showTime">
                    <div v-for="meeting in firstSec.meetings" :key="meeting.days" class="cb-item">
                        {{ meeting.days }}
                    </div>
                </template>
                <div v-if="display.showInstructor" class="cb-item">
                    {{ firstSec.instructors.join(', ') }} and
                    {{ section.sections.reduce((acc, x) => acc + x.instructors.length, 0) - 1 }}
                    more
                </div>
                <div v-if="display.showRoom" class="cb-item">
                    {{ firstSec.meetings[0].room }} and {{ section.sections.length - 1 }} more
                </div>
            </div>
            <div v-else-if="isEvent(section)" class="ml-2">
                <div class="mt-2">
                    {{ section.title }}
                </div>
                <div class="cb-item">
                    {{ section.days }}<br />
                    {{ section.room }}
                </div>
                <div class="cb-item" v-html="section.description"></div>
            </div>
        </template>
        <div v-else class="mt-2 ml-2" style="font-size: 10px">
            <div v-if="isSection(section)">
                {{ firstSec.department }} <br />
                {{ firstSec.number }} <br />
                {{ firstSec.section }}
            </div>
            <div v-else-if="isCourse(section)">
                {{ firstSec.department }} <br />
                {{ firstSec.number }} <br />
                {{ firstSec.section }} + {{ section.sections.length - 1 }}
            </div>
            <div v-else-if="isEvent(section)">
                {{ section.days }}
            </div>
        </div>
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
    text-shadow: 0px 0px 4px #555;
    /* text-shadow: -1px 0 #222, 0 1px black, 1px 0 black, 0 -1px black; */
}

.block-strong {
    box-shadow: 0 4px 12px 4px rgba(0, 0, 0, 0.5);
}

.courseBlock:hover {
    box-shadow: 0 4px 12px 4px rgba(0, 0, 0, 0.5);
}

.cb-item {
    font-size: 11px;
}
</style>
