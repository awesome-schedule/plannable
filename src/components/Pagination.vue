<template>
    <nav>
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
            <li :class="'page-item' + (start <= 0 && idx <= start ? ' disabled' : '')">
                <a
                    class="page-link"
                    href="#"
                    tabindex="-1"
                    aria-disabled="true"
                    @click="
                        switchPage(idx - 1);
                        updateStart();
                    "
                    >&laquo;</a
                >
            </li>
            <li
                v-for="index in length"
                :key="index"
                :class="'page-item' + (idx === index - 1 + start ? ' active' : '')"
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
            <li :class="'page-item' + (idx >= scheduleLength - 1 ? ' disabled' : '')">
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
