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
        showTime: Boolean,
        showRoom: Boolean,
        showInstructor: Boolean
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
            const temp = (parseFloat(t[0]) - 8) * 2;
            for (let i = 0; i < temp; i++) {
                start += this.heightInfo[i];
            }
            if (parseInt(t[1]) >= 30) {
                start += this.heightInfo[temp];
                if (parseInt(t[1]) > 30) {
                    start += ((parseFloat(t[1]) - 30) / 30) * this.fullHeight;
                }
            } else {
                start += (parseFloat(t[1]) / 30) * this.fullHeight;
            }
            return start;
        },

        endPx() {
            let end = 48;
            const t = this.course.end.split(':');
            const temp = (parseFloat(t[0]) - 8) * 2;
            for (let i = 0; i < temp; i++) {
                end += this.heightInfo[i];
            }
            if (parseInt(t[1]) >= 30) {
                end += this.heightInfo[temp];
                if (parseInt(t[1]) > 30) {
                    end += ((parseFloat(t[1]) - 30) / 30) * this.fullHeight;
                }
            } else {
                end += (parseFloat(t[1]) / 30) * this.fullHeight;
            }
            return end;
        }
    }
});
</script>

<style scoped>
.courseBlock:hover {
    box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19);
}
</style>
