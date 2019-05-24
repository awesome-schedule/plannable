<template>
    <div id="course-modal" class="modal fade" tabindex="-1" role="dialog">
        <div class="modal-dialog modal-lg" role="document">
            <div v-if="course" class="modal-content">
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
                    <div style="width: 100%; overflow-x: auto;">
                        <table style="color:#808080; font-size:0.75rem;">
                            <tr v-for="(section, i) in course.sections" :key="section.key + i">
                                <td class="info">Section:&nbsp;{{ section.section }}</td>
                                <td class="info">ID:&nbsp;{{ section.id }}</td>
                                <td class="info">
                                    {{ section.topic }}
                                </td>
                                <td class="info">{{ section.instructors.join(' ') }}</td>
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
                    </div>

                    <p class="mt-2">{{ course.description }}</p>

                    <button class="btn btn-outline-info" @click="openVAGrade(course)">
                        Grade Distribution
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts" src="./CourseModal.ts"></script>

<style scoped>
.info {
    white-space: nowrap;
    vertical-align: top;
    padding-right: 12px;
}
</style>
