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
    >
        <div v-if="!mobile" style="height:100%">
            <div
                v-if="isCourse(scheduleBlock)"
                data-toggle="modal"
                data-target="#modal"
                style="height:100%"
                @click="$parent.$emit('trigger-modal', scheduleBlock.section)"
            >
                <div class="mt-2 ml-2" style="color:white; font-size:13px">
                    {{ firstSec.department }} {{ firstSec.number }}-{{ firstSec.section }}
                    {{ firstSec.type }}
                </div>
                <div v-if="showInstructor" class="ml-2" style="color:#eaeaea; font-size:11px">
                    {{ firstSec.instructors.join(', ') }}
                </div>
                <!-- <div v-if="showRoom" class="ml-2" style="color:#eaeaea; font-size:11px">
                    {{ scheduleBlock.meeting.room }}
                </div> -->
                <template v-if="showTime">
                    <div v-for="(meeting, idx) in firstSec.meetings" :key="idx">
                        <div v-if="showTime" class="ml-2" style="color:#eaeaea; font-size:11px">
                            {{ meeting.days }}
                        </div>
                    </div>
                </template>
            </div>
            <div
                v-else
                data-toggle="modal"
                data-target="#class-list-modal"
                style="height:100%"
                @click="$parent.$parent.showClassListModal(sectionsToCourse(scheduleBlock.section))"
            >
                <div class="mt-2 ml-2" style="color:white; font-size:13px">
                    {{ firstSec.department }}
                    {{ firstSec.number }}-{{ firstSec.section }} +{{
                        scheduleBlock.section.length - 1
                    }}
                    {{ firstSec.type }}
                </div>
                <template v-if="showTime">
                    <div v-for="(meeting, idx) in firstSec.meetings" :key="idx">
                        <div v-if="showTime" class="ml-2" style="color:#eaeaea; font-size:11px">
                            {{ meeting.days }}
                        </div>
                    </div>
                </template>
                <div v-if="showInstructor" class="ml-2" style="color:#eaeaea; font-size:11px">
                    {{ firstSec.instructors.join(', ') }} and
                    {{
                        scheduleBlock.section.reduce((acc, x) => acc + x.instructors.length, 0) - 1
                    }}
                    more
                </div>
                <div v-if="showRoom" class="ml-2" style="color:#eaeaea; font-size:11px">
                    {{ firstSec.meetings[0].room }} and {{ scheduleBlock.section.length - 1 }} more
                </div>
            </div>
        </div>
        <div v-else class="mt-2 ml-2" style="color:white; font-size:10px">
            <div
                v-if="isCourse(scheduleBlock)"
                data-toggle="modal"
                data-target="#modal"
                @click="$parent.$emit('trigger-modal', scheduleBlock.section)"
            >
                {{ firstSec.department }} <br />
                {{ firstSec.number }} <br />
                {{ firstSec.section }}
            </div>
            <div
                v-else
                data-toggle="modal"
                data-target="#class-list-modal"
                @click="$parent.$parent.showClassListModal(sectionsToCourse(scheduleBlock.section))"
            >
                {{ firstSec.department }} <br />
                {{ firstSec.number }} <br />
                {{ firstSec.section }} +{{ scheduleBlock.section.length - 1 }}
            </div>
        </div>
    </div>
</template>

<script>
import ScheduleBlock from '../models/ScheduleBlock';
import Section from '../models/Section';
import Course from '../models/Course';
import Vue from 'vue';
export default Vue.extend({
    name: 'CourseBlock',
    props: {
        scheduleBlock: ScheduleBlock,
        /**
         * @type {number[]}
         */
        heightInfo: Array,
        fullHeight: Number,
        partialHeight: Number,
        showTime: Boolean,
        showRoom: Boolean,
        showInstructor: Boolean,
        absoluteEarliest: Number
    },
    data() {
        return {
            mobile: window.screen.width < 900
        };
    },
    computed: {
        /**
         * @returns {number}
         */
        startPx() {
            let start = 48;
            const t = this.scheduleBlock.start.split(':');
            // const hr = parseInt(t[0]);
            const min = parseInt(t[1]) >= 30 ? parseInt(t[1]) - 30 : parseInt(t[1]);

            const temp = this.timeToNum(this.scheduleBlock.start, true);
            for (let i = this.absoluteEarliest; i < temp; i++) {
                start += this.heightInfo[i - this.absoluteEarliest];
            }
            start += (min / 30) * this.fullHeight;
            return start;
        },

        /**
         * @returns {number}
         */
        endPx() {
            let end = 48;
            const t = this.scheduleBlock.end.split(':');
            const min = parseInt(t[1]) >= 30 ? parseInt(t[1]) - 30 : parseInt(t[1]);

            const temp = this.timeToNum(this.scheduleBlock.end, false);
            for (let i = this.absoluteEarliest; i < temp; i++) {
                end += this.heightInfo[i - this.absoluteEarliest];
            }
            end += (min / 30) * this.fullHeight;
            return end;
        },

        /**
         * @returns {Section}
         */
        firstSec() {
            const section = this.scheduleBlock.section;
            if (section instanceof Array) {
                return section[0];
            } else return section;
        }
    },
    methods: {
        /**
         * @param {number} time
         * @param {number} start
         * @returns {number}
         */
        timeToNum(time, start) {
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
                } else if (min > 0) {
                    t += 1;
                }
            }
            return t - 1;
        },
        /**
         * @param {ScheduleBlock} crs
         */
        isCourse(crs) {
            return !(crs.section instanceof Array);
        },
        /**
         * @param {Section[]} sections
         */
        sectionsToCourse(sections) {
            const course = sections[0].course;
            return new Course(course.raw, course.key, sections.map(x => x.sid));
        }
    }
});
</script>

<style scoped>
.courseBlock:hover {
    box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19);
}
</style>
