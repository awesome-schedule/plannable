<template>
    <nav class="bg-light sidebar">
        <div class="btn bg-info nav-btn">
            Log History
        </div>
        <ul class="list-group list-group-flush mx-1">
            <li
                v-for="(item, idx) in noti.history"
                :key="idx"
                class="list-group-item pt-1 pb-2 px-2 my-0"
            >
                <span :class="`text-${item.cls}`" v-html="item.msg"></span> <br />
                <small class="text-muted">
                    <span class="px-2 py-1" :class="`bg-${item.cls}`" style="color: white">{{
                        item.cls === 'danger' ? 'error' : item.cls
                    }}</span>
                    {{ item.stamp }}
                </small>
            </li>
        </ul>
    </nav>
</template>

<script lang="ts" src="./LogView.ts"></script>
