<template>
    <div
        class="courseBlock"
        :style="{
            'margin-top': startPx + 'px',
            position: 'absolute',
            width: '20%',
            height: endPx - startPx + 'px',
            'background-color': course.backgroundColor,
            'z-index': '2',
            color: 'white',
            cursor: 'pointer'
        }"
    >
        <div v-if="!mobile" style="height:100%">
            <div
                v-if="isCourse(course)"
                data-toggle="modal"
                data-target="#modal"
                style="height:100%"
                @click="$parent.$emit('trigger-modal', course)"
            >
                <div class="mt-2 ml-2" style="color:white; font-size:13px">
                    {{ course.department }} {{ course.number }}-{{ course.section }}
                    {{ course.type }}
                </div>
                <div v-if="showTime" class="ml-2" style="color:#eaeaea; font-size:11px">
                    {{ course.days }}
                </div>
                <div v-if="showInstructor" class="ml-2" style="color:#eaeaea; font-size:11px">
                    {{ course.instructor.join(', ') }}
                </div>
                <div v-if="showRoom" class="ml-2" style="color:#eaeaea; font-size:11px">
                    {{ course.room }}
                </div>
            </div>
            <div
                v-else
                data-toggle="modal"
                data-target="#class-list-modal"
                style="height:100%"
                @click="$parent.$parent.showClassListModal(course)"
            >
                <div class="mt-2 ml-2" style="color:white; font-size:13px">
                    {{ course.department }} {{ course.number }}-{{ course.section[0] }} +{{
                        course.section.length - 1
                    }}
                    {{ course.type }}
                </div>
                <div v-if="showTime" class="ml-2" style="color:#eaeaea; font-size:11px">
                    {{ course.days[0] }}
                </div>
                <div v-if="showInstructor" class="ml-2" style="color:#eaeaea; font-size:11px">
                    {{ course.instructor[0].join(', ') }} and
                    {{ course.instructor.length - 1 }} more
                </div>
                <div v-if="showRoom" class="ml-2" style="color:#eaeaea; font-size:11px">
                    {{ course.room[0] }} and {{ course.room.length - 1 }} more
                </div>
            </div>
        </div>
        <div v-if="mobile" class="mt-2 ml-2" style="color:white; font-size:10px">
            <div
                v-if="isCourse(course)"
                data-toggle="modal"
                data-target="#modal"
                @click="$parent.$emit('trigger-modal', course)"
            >
                {{ course.department }} <br />
                {{ course.number }} <br />
                {{ course.section }}
            </div>
            <div v-else>
                {{ course.department }} <br />
                {{ course.number }} <br />
                {{ course.section[0] }} +{{ course.section.length - 1 }}
            </div>
        </div>
    </div>
</template>

<script>
import ScheduleBlock from '../models/ScheduleBlock';
import Vue from 'vue';
export default Vue.extend({
    name: 'CourseBlock',
    props: {
        course: ScheduleBlock,
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
        startPx() {
            let start = 48;
            const t = this.course.start.split(':');
            // const hr = parseInt(t[0]);
            const min = parseInt(t[1]) >= 30 ? parseInt(t[1]) - 30 : parseInt(t[1]);

            const temp = this.timeToNum(this.course.start, true);
            for (let i = this.absoluteEarliest; i < temp; i++) {
                start += this.heightInfo[i - this.absoluteEarliest];
            }
            start += (min / 30) * this.fullHeight;
            return start;
        },

        endPx() {
            let end = 48;
            const t = this.course.end.split(':');
            const min = parseInt(t[1]) >= 30 ? parseInt(t[1]) - 30 : parseInt(t[1]);

            const temp = this.timeToNum(this.course.end, false);
            for (let i = this.absoluteEarliest; i < temp; i++) {
                end += this.heightInfo[i - this.absoluteEarliest];
            }
            end += (min / 30) * this.fullHeight;
            return end;
        }
    },
    methods: {
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
            return crs.section instanceof Array;
        }
    }
});
</script>

<style scoped>
.courseBlock:hover {
    box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19);
}
</style>
