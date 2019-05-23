<template>
    <nav v-if="generated">
        <ul class="pagination justify-content-center" style="margin-bottom: 0">
            <li class="input-group" style="width:80px">
                <input
                    v-model="goto"
                    type="number"
                    placeholder="Go to"
                    class="form-control"
                    style="border-radius: 4px 0px 0px 4px !important"
                    @input="
                        switchPage(goto - 1);
                        updateStart();
                    "
                />
            </li>
            <li class="page-item" :class="{ disabled: start <= 0 && idx <= start }">
                <a
                    class="page-link"
                    href="#"
                    @click="
                        switchPage(idx - 1);
                        updateStart();
                    "
                    >&laquo;</a
                >
            </li>
            <!-- Note: v-for in number gives 1 to number inclusive -->
            <li
                v-for="index in length"
                :key="index"
                class="page-item"
                :class="{ active: idx === index + start - 1 }"
            >
                <a
                    class="page-link"
                    href="#"
                    @click="
                        switchPage(index + start - 1);
                        updateStart();
                    "
                >
                    {{ index + start }}
                </a>
            </li>
            <li class="page-item" :class="{ disabled: idx >= scheduleLength - 1 }">
                <a
                    class="page-link"
                    href="#"
                    @click="
                        switchPage(idx + 1);
                        updateStart();
                    "
                    >&raquo;</a
                >
            </li>
        </ul>
    </nav>
</template>

<script lang="ts" src="./Pagination.ts"></script>
