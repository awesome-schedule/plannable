<template>
    <div id="course-modal" class="modal fade" tabindex="-1" role="dialog">
        <div class="modal-dialog modal-lg" role="document">
            <div v-if="course" class="modal-content">
                <div class="modal-header">
                    <h5
                        class="modal-title"
                        v-html="highlightMatch(course.displayName, 'key', match[0])"
                    ></h5>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div class="modal-body">
                    <h6 v-html="highlightMatch(course.title, 'title', match[0])"></h6>
                    <div style="width: 100%; overflow-x: auto;">
                        <table id="sec-table" class="m-color">
                            <tr v-for="section in course.sections" :key="section.section">
                                <td>Section&nbsp;{{ section.section }}</td>
                                <td>ID:&nbsp;{{ section.id }}</td>
                                <td
                                    v-html="
                                        highlightMatch(
                                            section.topic,
                                            'topic',
                                            match[1].get(section.sid)
                                        )
                                    "
                                ></td>
                                <td
                                    v-html="
                                        highlightMatch(
                                            section.instructors.join(', '),
                                            'instructors',
                                            match[1].get(section.sid)
                                        )
                                    "
                                ></td>
                                <td>
                                    {{ section.dates }}
                                </td>
                                <td>
                                    <template v-for="(meeting, idx) in section.meetings"
                                        >{{ meeting.days }} <br :key="idx" />
                                    </template>
                                </td>
                                <td>
                                    <template v-for="(meeting, idx) in section.meetings"
                                        >{{ meeting.room }} <br :key="idx" />
                                    </template>
                                </td>
                                <td>{{ section.status }}</td>
                                <td>
                                    {{ section.enrollment + '/' + section.enrollment_limit }}
                                </td>
                            </tr>
                        </table>
                    </div>

                    <p
                        class="mt-2"
                        v-html="highlightMatch(course.description, 'description', match[0])"
                    ></p>

                    <button
                        v-if="config.enableGrades"
                        class="btn btn-outline-info"
                        @click="config.viewGrades(course)"
                    >
                        Grade Distribution
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts" src="./CourseModal.ts"></script>

<style scoped>
#sec-table {
    font-size: 0.8rem;
}
#sec-table > tr > td {
    white-space: nowrap;
    vertical-align: top;
    padding-right: 12px;
}
</style>
