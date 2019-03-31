<template>
    <div
        class="courseBlock"
        data-toggle="modal"
        data-target="#modal"
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
        @click="$parent.$emit('trigger-modal', course)"
    >
        <div v-if="!mobile" class="mt-2 ml-2" style="color:white; font-size:13px">
            {{ course.department }} {{ course.number }}-{{ course.section }} {{ course.type }}
        </div>
        <div v-if="mobile" class="mt-2 ml-2" style="color:white; font-size:10px">
            {{ course.department }} <br />
            {{ course.number }} <br />
            {{ course.section }}
        </div>
        <div v-if="showTime && !mobile" class="ml-2" style="color:#eaeaea; font-size:11px">
            {{ course.days }}
        </div>
        <div v-if="showInstructor && !mobile" class="ml-2" style="color:#eaeaea; font-size:11px">
            {{ course.instructor.join(', ') }}
        </div>
        <div v-if="showRoom && !mobile" class="ml-2" style="color:#eaeaea; font-size:11px">
            {{ course.room }}
        </div>
    </div>
</template>

<script>
import Course from '../models/Course';
import Vue from 'vue';
export default Vue.extend({
    name: 'CourseBlock',
    props: {
        course: Course,
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
        }
    }
});
</script>

<style scoped>
.courseBlock:hover {
    box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19);
}
</style>
