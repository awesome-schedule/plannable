<template>
    <div id="section-modal" class="modal fade" tabindex="-1" role="dialog">
        <div class="modal-dialog modal-lg" role="document">
            <div v-if="section" class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">
                        {{ section.department }} {{ section.number }} {{ section.title }}
                        {{ section.id }}
                    </h5>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div class="modal-body">
                    <div v-if="section.topic" style="color:#a0a0a0">{{ section.topic }}</div>
                    <div style="color:#a0a0a0">{{ section.type }} | {{ section.units }} units</div>
                    <div style="color:#a0a0a0">{{ section.instructors.join(', ') }}</div>
                    <div
                        v-for="(meeting, idx) in section.meetings"
                        :key="idx"
                        style="color:#a0a0a0"
                    >
                        {{ meeting.days }} {{ meeting.room }}
                    </div>
                    <div style="color:#a0a0a0">
                        {{ section.status }} {{ section.enrollment }}/{{ section.enrollment_limit }}
                    </div>
                    <br />
                    <div>{{ section.description }}</div>
                    <div v-if="semester" class="mt-2">
                        <button
                            class="btn btn-outline-info mr-2"
                            @click="openLousList(semester.id, section.id)"
                        >
                            More Details (Lou's List)
                        </button>
                        <button class="btn btn-outline-info" @click="openVAGrade(section)">
                            Grade Distribution
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts" src="./SectionModal.ts"></script>

<style></style>
