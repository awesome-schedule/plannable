<template>
    <div class="modal fade" tabindex="-1" role="dialog">
        <div class="modal-dialog modal-lg" role="document">
            <div v-if="course !== null" class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">
                        {{ course.department }} {{ course.number }} {{ course.title }}
                    </h5>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div class="modal-body">
                    <h6>{{ course.type }}</h6>
                    <table style="color:#808080; font-size:0.75rem; width:95%">
                        <tr v-for="(_, i) in course.section" :key="i">
                            <td class="info">Section:&nbsp;{{ course.section[i] }}</td>
                            <td v-if="course.topic[i] !== ''" class="info">
                                {{ course.topic[i] }}
                            </td>
                            <td class="info" width="20%">{{ course.instructor[i].join(' ') }}</td>
                            <td class="info">{{ course.days[i] }}</td>
                            <td class="info">{{ course.room[i] }}</td>
                            <td class="info">{{ course.status[i] }}</td>
                            <td class="info">
                                {{ course.enrollment[i] + '/' + course.enrollment_limit[i] }}
                            </td>
                        </tr>
                    </table>

                    <p class="mt-2">{{ course.description }}</p>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import CourseRecord from '../models/CourseRecord';
export default {
    props: {
        course: CourseRecord
    }
};
</script>

<style scoped>
.info {
    padding-right: 10px;
}
</style>
