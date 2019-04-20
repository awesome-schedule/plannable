<template>
    <nav class="d-block bg-light sidebar">
        <button class="btn btn-info nav-btn">
            Palette
        </button>
        <ul v-if="$parent.generated" class="list-group list-group-flush mx-1">
            <li v-for="pair in courseColors()" :key="pair[0]" class="list-group-item py-1 px-2">
                <div class="row no-gutters justify-content-between" style="width: 100%">
                    <div class="col-md-auto" style="font-size: 13px">
                        <label :for="`color-${pair[1]}`">
                            {{ convertKey(pair[0]) }}
                        </label>
                    </div>
                    <div class="col-md-auto">
                        <i
                            class="fas fa-sync-alt click-icon mr-1"
                            @click="setColor(pair[0], randomColor())"
                        ></i>
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
        </ul>
        <ul v-else class="list-group list-group-flush mx-1">
            <li class="list-group-item">
                You need to generate a schedule in order to change its color
            </li>
        </ul>
    </nav>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator';
import Schedule from '../models/Schedule';
import randomColor from 'randomcolor';
import { convertKey } from '../models/Utils';

@Component
export default class Palette extends Vue {
    @Prop(Schedule) readonly schedule!: Schedule;

    parent = this.$parent as any;

    randomColor() {
        return randomColor({
            luminosity: 'dark'
        });
    }
    setColor(key: string, color: string) {
        this.schedule.setColor(key, color);
        this.parent.saveStatus();
        this.$forceUpdate();
    }
    /**
     * colors must always be recomputed becahse `Schedule.savedColors` is not a reactive property
     */
    courseColors() {
        return Object.entries(Schedule.savedColors)
            .filter(entry => this.schedule.has(entry[0]))
            .concat(
                this.schedule.colorSlots.reduce(
                    (arr: Array<[string, string]>, bucket, i) =>
                        arr.concat(
                            [...bucket.values()].map(
                                x => [x, Schedule.bgColors[i]] as [string, string]
                            )
                        ),
                    []
                )
            )
            .sort((a, b) => (a[0] === b[0] ? 0 : a[0] < b[0] ? -1 : 1));
    }
    convertKey(key: string) {
        return convertKey(window.catalog, this.parent.currentSchedule, key);
    }
}
</script>

<style scoped>
.list-group-item {
    background-color: #f8f8f8;
}
</style>
