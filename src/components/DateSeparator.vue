<template>
    <div class="btn-group ml-4" role="group" v-if="curSchedule.dateSeparators.length > 2">
        <button
            v-for="idx in curSchedule.dateSeparators.length - 1"
            :key="idx"
            class="btn btn-outline-primary flex-shrink-0"
            @click="selectInterval(idx - 1)"
        >
            {{ convDate(curSchedule.dateSeparators[idx - 1]) }}
            -
            {{ convDate(curSchedule.dateSeparators[idx], -1) }}
            <i v-if="curSchedule.dateSelector === idx - 1" class="fas fa-check"></i>
        </button>

        <button
            type="button"
            class="btn btn-outline-primary flex-shrink-0"
            @click="selectInterval(-1)"
        >
            Show All Classes
            <i v-if="curSchedule.dateSelector === -1" class="fas fa-check"></i>
        </button>
    </div>
</template>

<script lang="ts" src="./DateSeparator.ts"></script>
