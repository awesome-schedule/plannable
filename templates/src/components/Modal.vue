<template>
    <div class="modal fade" tabindex="-1" role="dialog">
        <div v-if="course !== null" class="modal-dialog modal-lg" role="document">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">
                        {{ course.department }} {{ course.number }} {{ course.title }}
                    </h5>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div class="modal-body">
                    <div style="color:#a0a0a0">{{ course.type }} | {{ course.units }} units</div>
                    <div style="color:#a0a0a0">{{ course.days }}</div>
                    <div style="color:#a0a0a0">{{ course.room }}</div>
                    <div style="color:#a0a0a0">{{ course.instructor.join(', ') }}</div>
                    <br />
                    <div>{{ course.description }}</div>
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

<style></style>
