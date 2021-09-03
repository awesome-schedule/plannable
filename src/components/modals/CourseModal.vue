<template>
    <div id="course-modal" class="modal fade" tabindex="-1" role="dialog">
        <div class="modal-dialog modal-lg" role="document">
            <div v-if="course" class="modal-content">
                <div class="modal-header">
                    <h5
                        class="modal-title"
                        v-html="
                            highlightMatch(course.displayName, 'key', match[0]) + ' ' + course.title
                        "
                    ></h5>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div class="modal-body">
                    <h6 v-html="highlightMatch(course.title, 'title', match[0])"></h6>
                    <div style="width: 100%; overflow-x: auto">
                        <table id="sec-table" class="m-color w-100">
                            <!-- <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Section</th>
                                    <th>Topic</th>
                                    <th>Instructors</th>
                                    <th>Dates</th>
                                    <th>Days</th>
                                    <th>Rooms</th>
                                    <th>Status</th>
                                    <th>Enrollment/Limit/Wait list</th>
                                </tr>
                            </thead> -->
                            <tbody>
                                <tr v-for="section in course.sections" :key="section.section">
                                    <td>{{ section.id }}</td>
                                    <td>{{ section.section }}</td>
                                    <td
                                        v-html="
                                            highlightMatch(
                                                section.topic,
                                                'topic',
                                                match[1].get(section.id)
                                            )
                                        "
                                    ></td>
                                    <td
                                        v-html="
                                            highlightMatch(
                                                section.instructors,
                                                'instructors',
                                                match[1].get(section.id)
                                            )
                                        "
                                    ></td>
                                    <td>
                                        {{ section.dates }}
                                    </td>
                                    <td>
                                        <div :key="idx" v-for="(meeting, idx) in section.meetings">
                                            {{ meeting.days }}
                                        </div>
                                    </td>
                                    <td>
                                        <div :key="idx" v-for="(meeting, idx) in section.meetings">
                                            <a
                                                v-if="formatLocationURL(meeting.room)"
                                                :href="formatLocationURL(meeting.room)"
                                                target="_blank"
                                                >{{ meeting.room }}
                                            </a>
                                            <template v-else>
                                                {{ meeting.room }}
                                            </template>
                                        </div>
                                    </td>
                                    <td>{{ section.status }}</td>
                                    <td>
                                        {{
                                            `${section.enrollment}/${section.enrollment_limit}/${section.wait_list}`
                                        }}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <p
                        class="mt-2"
                        v-html="highlightMatch(course.description, 'description', match[0])"
                    ></p>
                    <hr class="mb-2" />
                    <h6>External Links:</h6>
                    <div v-if="semester">
                        <button
                            v-for="item in links"
                            :key="item.name"
                            class="btn btn-outline-info mr-2 mb-2"
                            @click="item.action(semester, course)"
                        >
                            {{ item.name }}
                        </button>
                    </div>
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
