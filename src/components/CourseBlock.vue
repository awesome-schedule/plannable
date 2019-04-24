<template>
    <div
        class="courseBlock"
        :style="{
            'margin-top': startPx + 'px',
            position: 'absolute',
            width: '20%',
            height: endPx - startPx + 'px',
            'background-color': scheduleBlock.backgroundColor,
            'z-index': '2',
            color: 'white',
            cursor: 'pointer'
        }"
        @click="showModal"
    >
        <div v-if="!mobile">
            <div v-if="isSection">
                <div class="mt-2 ml-2" style="color:white; font-size:13px">
                    {{ firstSec.department }} {{ firstSec.number }}-{{ firstSec.section }}
                    {{ firstSec.type }}
                </div>
                <div v-if="showInstructor" class="ml-2 crs-info">
                    {{ firstSec.instructors.join(', ') }}
                </div>
                <div v-if="showRoom && room" class="ml-2 crs-info">
                    {{ room }}
                </div>
                <template v-if="showTime">
                    <div v-for="(meeting, idx) in firstSec.meetings" :key="idx">
                        <div v-if="showTime" class="ml-2 crs-info">
                            {{ meeting.days }}
                        </div>
                    </div>
                </template>
            </div>
            <div v-if="isSectionArray">
                <div class="mt-2 ml-2" style="color:white; font-size:13px">
                    {{ firstSec.department }}
                    {{ firstSec.number }}-{{ firstSec.section }} +{{
                        scheduleBlock.section.length - 1
                    }}
                    {{ firstSec.type }}
                </div>
                <template v-if="showTime">
                    <div v-for="(meeting, idx) in firstSec.meetings" :key="idx">
                        <div v-if="showTime" class="ml-2 crs-info">
                            {{ meeting.days }}
                        </div>
                    </div>
                </template>
                <div v-if="showInstructor" class="ml-2 crs-info">
                    {{ firstSec.instructors.join(', ') }} and
                    {{
                        scheduleBlock.section.reduce((acc, x) => acc + x.instructors.length, 0) - 1
                    }}
                    more
                </div>
                <div v-if="showRoom" class="ml-2 crs-info">
                    {{ firstSec.meetings[0].room }} and {{ scheduleBlock.section.length - 1 }} more
                </div>
            </div>
            <div v-if="isEvent">
                <div class="ml-2 mt-2">
                    {{ scheduleBlock.section.title }}
                </div>
                <div class="ml-2 crs-info">
                    {{ scheduleBlock.section.days }}<br />
                    {{ scheduleBlock.section.room }}
                </div>
                <div class="ml-2 crs-info" v-html="scheduleBlock.section.description"></div>
            </div>
        </div>
        <div v-else class="mt-2 ml-2" style="color:white; font-size:10px">
            <div v-if="isSection">
                {{ firstSec.department }} <br />
                {{ firstSec.number }} <br />
                {{ firstSec.section }}
            </div>
            <div v-if="isSectionArray">
                {{ firstSec.department }} <br />
                {{ firstSec.number }} <br />
                {{ firstSec.section }} +{{ scheduleBlock.section.length - 1 }}
            </div>
            <div v-if="isEvent">
                {{ scheduleBlock.section.days }}
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import ScheduleBlock from '../models/ScheduleBlock';
import Section from '../models/Section';
import Course from '../models/Course';
import Event from '../models/Event';
import { to12hr } from '../models/Utils';
import { Vue, Component, Prop } from 'vue-property-decorator';

@Component
export default class CourseBlock extends Vue {
    @Prop(Object) readonly scheduleBlock!: ScheduleBlock;
    @Prop(Array) readonly heightInfo!: number[];
    @Prop(Number) readonly fullHeight!: number;
    @Prop(Number) readonly partialHeight!: number;
    @Prop(Boolean) readonly showTime!: boolean;
    @Prop(Boolean) readonly showRoom!: boolean;
    @Prop(Boolean) readonly showInstructor!: boolean;
    @Prop(Number) readonly absoluteEarliest!: number;
    @Prop(String) readonly day!: string;

    mobile = window.screen.width < 450;

    get startPx() {
        return this.getPx(this.scheduleBlock.start, true);
    }

    get endPx() {
        return this.getPx(this.scheduleBlock.end, false);
    }

    getPx(time: string, start: boolean) {
        let px = 48;
        const t = time.split(':');
        const min = parseInt(t[1]) >= 30 ? parseInt(t[1]) - 30 : parseInt(t[1]);

        const temp = this.timeToNum(time, start);
        for (let i = this.absoluteEarliest; i < temp; i++) {
            px += this.heightInfo[i - this.absoluteEarliest];
        }
        px += (min / 30) * this.fullHeight;
        return px;
    }

    get firstSec() {
        const section = this.scheduleBlock.section;
        if (section instanceof Array) {
            return section[0];
        } else return section;
    }

    get room() {
        if (!(this.firstSec instanceof Section)) return null;

        for (const meeting of this.firstSec.meetings) {
            if (meeting.days.indexOf(this.day) !== -1) {
                const convedStart = to12hr(this.scheduleBlock.start);
                const convedEnd = to12hr(this.scheduleBlock.end);
                const [days, start, , end] = meeting.days.split(' ');
                if (convedStart === start && convedEnd === end) {
                    return meeting.room;
                }
            }
        }
        return null;
    }
    get isSection() {
        return this.scheduleBlock.section instanceof Section;
    }
    get isEvent() {
        return this.scheduleBlock.section instanceof Event;
    }
    get isSectionArray() {
        return this.scheduleBlock.section instanceof Array && this.scheduleBlock.section.length;
    }

    timeToNum(time: string, start: boolean) {
        const sep = time.split(':');
        const min = parseInt(sep[1]);
        let t = (parseInt(sep[0]) - 8) * 2;
        if (start) {
            if (min >= 30) {
                t += 2;
            } else {
                t += 1;
            }
        } else {
            if (min > 30) {
                t += 2;
            } else {
                t += 1;
            }
        }
        return t - 1;
    }

    showModal() {
        const $parent = this.$parent as any;
        const section = this.scheduleBlock.section;
        if (this.isSection) {
            $parent.$emit('trigger-modal', section);
        } else if (this.isSectionArray) {
            $parent.$parent.showCourseModal(Section.sectionsToCourse(section as Section[]));
        } else if (this.isEvent) {
            $parent.$emit('editEvent', section);
        }
    }
}
</script>

<style scoped>
.courseBlock:hover {
    box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19);
}

.crs-info {
    color: #eaeaea;
    font-size: 11px;
}
</style>
