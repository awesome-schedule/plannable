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
                        <tr v-for="(section, i) in course.sections" :key="section.key + i">
                            <td class="info">Section:&nbsp;{{ section.section }}</td>
                            <td v-if="section.topic !== ''" class="info">
                                {{ section.topic }}
                            </td>
                            <td class="info" width="20%">{{ section.instructors.join(' ') }}</td>
                            <td class="info">
                                <template v-for="(meeting, j) in section.meetings"
                                    >{{ meeting.days }} <br :key="j" />
                                </template>
                            </td>
                            <td class="info">
                                <template v-for="(meeting, j) in section.meetings"
                                    >{{ meeting.room }} <br :key="j" />
                                </template>
                            </td>
                            <td class="info">{{ section.status }}</td>
                            <td class="info">
                                {{ section.enrollment + '/' + section.enrollment_limit }}
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
import Course from '../models/Course';
export default {
    props: {
        course: Course
    }
};
</script>

<style scoped>
.info {
    padding-right: 10px;
    vertical-align: top;
}
</style>
