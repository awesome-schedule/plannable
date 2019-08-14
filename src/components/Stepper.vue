<template>
    <div class="card my-4">
        <div class="card-header container">
            <div class="row">
                <div
                    v-for="(item, idx) in info"
                    :key="item.title"
                    class="col"
                    style="cursor: pointer"
                    @click="goto(idx)"
                >
                    <div
                        :style="
                            `height: 24px; width: 24px; border-radius: 12px; background-color: ${
                                idx === curIdx ? '#019872' : 'grey'
                            }; color: white; text-align: center`
                        "
                    >
                        <div style="font-size: 12px; padding-top: 3px">
                            {{ idx + 1 }}
                        </div>
                    </div>
                    <div v-if="alwaysTitle" class="mt-2" style="font-size: 12px">
                        {{ item.title }}
                    </div>
                </div>
            </div>
        </div>
        <div class="card-body" style="text-align: center">
            <img :src="info[curIdx].src" :alt="info[curIdx].title" class="img-fluid" />
            <p v-if="!alwaysTitle" class="mt-4" style="font-size: 14px; text-align:left !important">
                {{ info[curIdx].title }}
            </p>
        </div>
        <div v-if="helper" class="card-footer">
            <button class="btn btn-primary mr-3" @click="next()">Next</button>
            <button class="btn btn-primary" @click="back()">Back</button>
        </div>
    </div>
</template>
<script src="./Stepper.ts"></script>
