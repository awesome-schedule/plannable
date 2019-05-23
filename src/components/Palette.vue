<template>
    <nav class="d-block bg-light sidebar">
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
                    <div class="row no-gutters justify-content-between w-100">
                        <div class="col-sm-auto mr-auto" style="font-size: 14px">
                            <label :for="`color-${pair[1]}`">
                                {{ convertKey(pair[0]) }}
                            </label>
                        </div>
                        <div class="col-sm-auto align-self-center">
                            <i
                                class="fas fa-sync-alt click-icon mr-1"
                                @click="palette.randColor(pair[0])"
                            ></i>
                        </div>
                        <div class="col-sm-auto">
                            <input
                                :id="`color-${pair[0]}`"
                                type="color"
                                :value="pair[1]"
                                style="width: 40px; height: 95%"
                                title="get a random color"
                                @change="palette.set(pair[0], $event.target.value)"
                            />
                        </div>
                    </div>
                </li>
            </template>
            <li v-else class="list-group-item">
                Select your class first. Then come back to change the color for display.
            </li>
        </ul>
    </nav>
</template>

<script lang="ts" src="./Palette.ts"></script>
