<template>
    <nav class="d-block bg-light sidebar">
        <button class="btn btn-info nav-btn">
            Palette
        </button>
        <ul class="list-group list-group-flush mx-1">
            <template v-if="numColors()">
                <li
                    v-for="(pair, idx) in courseColors()"
                    :key="idx"
                    class="list-group-item py-1 px-2"
                >
                    <div class="row no-gutters justify-content-between w-100">
                        <div class="col-sm-auto mr-auto" style="font-size: 14px">
                            <label :for="`color-${pair[1]}`">
                                {{ convertKey(pair[0]) }}
                            </label>
                        </div>
                        <div class="col-sm-auto align-self-center">
                            <i
                                class="fas fa-sync-alt click-icon mr-1"
                                @click="setColor(pair[0], randomColor())"
                            ></i>
                        </div>
                        <div class="col-sm-auto">
                            <input
                                :id="`color-${pair[0]}`"
                                type="color"
                                :value="pair[1]"
                                style="width: 40px; height: 95%"
                                @change="setColor(pair[0], $event.target.value)"
                            />
                        </div>
                    </div>
                </li>
            </template>
            <li v-else class="list-group-item">
                There's nothing in your schedule
            </li>
        </ul>
    </nav>
</template>

<script lang="ts" src="./Palette.ts"></script>

<style scoped>
.list-group-item {
    background-color: #f8f8f8;
}
</style>
