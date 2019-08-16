<template class='bg-primary'>
    <div class="container">
        <h1 class="display-2">Welcome to Plannable</h1>
        <img class="img-fluid" src="../assets/cover.jpg" />
        <hr class="my-4" />
        <p>
            Provide students with free and handy tools to schedule their classes more efficiently.
        </p>
        <div>
            <select v-model="currentSelect" class="custom-select custom-select-sm py-0">
                <option v-for="(item, index) in schoolNames" :key="index" :value="index">{{
                    item
                }}</option>
            </select>

            <button class="btn btn-primary" @click="redirection">
                Go to
            </button>
        </div>
        <div id="release-note"></div>
    </div>
</template>

<script lang="ts" src='./HomePage.ts'>
</script>

<style scoped>
.bg {
    background-color: rgb(99, 34, 34);
}
</style>