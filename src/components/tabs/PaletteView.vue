<template>
    <nav class="bg-light sidebar">
        <div class="btn bg-info nav-btn">
            Color Schemes
        </div>
        <ul class="list-group list-group-flush ml-2 mr-1 my-2 text-center schemes">
            <li
                v-for="(scheme, idx) in colorSchemes"
                :key="scheme.name"
                class="list-group-item list-group-item-action px-1"
                :class="{ active: +idx === display.colorScheme }"
                :title="scheme.description"
                @click="display.colorScheme = +idx"
            >
                <strong>{{ scheme.name }}</strong>
                <div class="row no-gutters">
                    <div
                        v-for="color in scheme.colors"
                        :key="color"
                        class="col"
                        :style="'background-color:' + color"
                    >
                        &nbsp;
                    </div>
                </div>
            </li>
        </ul>
        <div class="btn bg-info nav-btn">
            Palette
        </div>
        <ul class="list-group list-group-flush mx-1">
            <template v-if="numColors()">
                <li
                    v-for="(pair, idx) in courseColors()"
                    :key="idx"
                    class="list-group-item py-1 px-2"
                >
                    <div class="row no-gutters justify-content-between w-100 my-1">
                        <div class="col-sm-auto mr-auto" style="font-size: 14px">
                            {{ convertKey(pair[0]) }}
                        </div>
                        <div class="col-sm-auto align-self-center">
                            <i
                                class="fas fa-times click-icon mr-2"
                                style="font-size: 1.1rem"
                                title="reset to default"
                                @click="$delete(palette.savedColors, pair[0])"
                            ></i>
                            <i
                                class="fas fa-sync-alt click-icon mr-1"
                                title="get a random color"
                                @click="randColor(pair[0])"
                            ></i>
                            <input
                                type="color"
                                :value="pair[1]"
                                style="width: 30px"
                                @change="set(pair[0], $event.target.value)"
                            />
                        </div>
                    </div>
                </li>
            </template>
            <li v-else class="list-group-item">
                You can only customize colors of things displayed in your schedule. Please select
                your classes and generate your schedules, then come back to change the color for
                them.
            </li>
        </ul>
    </nav>
</template>

<script lang="ts" src="./PaletteView.ts"></script>

<style scoped>
.schemes {
    max-height: 30vh;
    overflow-y: auto;
    scrollbar-width: thin;
}
.schemes::-webkit-scrollbar {
    width: 5px;
}
.schemes::-webkit-scrollbar-thumb {
    width: 5px;
    background-color: #ccc;
}
</style>
