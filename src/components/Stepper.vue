<template>
    <div class="card my-4">
        <div class="card-header container">
            <div class="row no-gutters justify-content-between text-center">
                <div v-for="(item, idx) in info" :key="item.title" class="col" @click="goto(idx)">
                    <div class="stepper-icon mx-auto" :class="{ active: idx === curIdx }">
                        {{ idx + 1 }}
                    </div>
                    <div v-if="alwaysTitle" class="mt-2" style="font-size: 12px">
                        {{ item.title }}
                    </div>
                </div>
            </div>
        </div>
        <div class="card-body text-center">
            <img :src="info[curIdx].src" :alt="info[curIdx].title" class="img-fluid" />
            <p v-if="!alwaysTitle" class="mt-4 text-left" style="font-size: 14px">
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

<style scoped>
.stepper-icon {
    height: 24px;
    width: 24px;
    border-radius: 12px;
    color: white;
    text-align: center;
    background-color: grey;
    cursor: pointer;
    font-size: 14px;
}
.stepper-icon:hover {
    background-color: #019872;
}
.stepper-icon.active {
    background-color: #019872;
}
</style>
