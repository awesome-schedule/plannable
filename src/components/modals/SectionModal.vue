<template>
    <div id="section-modal" class="modal fade" tabindex="-1" role="dialog">
        <div class="modal-dialog modal-lg" role="document">
            <div v-if="section" class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">{{ section.displayName }} {{ section.id }}</h5>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div class="modal-body">
                    <div v-if="section.topic" class="m-color">{{ section.topic }}</div>
                    <div class="m-color">{{ section.type }} | {{ section.units }} units</div>
                    <div class="m-color">{{ section.instructors.join(', ') }}</div>
                    <div class="m-color">{{ section.dates }}</div>
                    <div v-for="(meeting, idx) in section.meetings" :key="idx" class="m-color">
                        {{ meeting.days }} @ {{ meeting.room }}
                    </div>
                    <div class="m-color">
                        {{ section.status }} {{ section.enrollment }}/{{
                            section.enrollment_limit
                        }}
                        | Wait List: {{ section.wait_list }}
                    </div>
                    <br />
                    <div>{{ section.description }}</div>
                    <div v-if="semester" class="mt-2">
                        <button
                            v-for="item in links"
                            :key="item.name"
                            class="btn btn-outline-info mr-2"
                            @click="item.action(semester, section)"
                        >
                            {{ item.name }}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts" src="./SectionModal.ts"></script>

<style>
.m-color {
    color: #888;
}
</style>
