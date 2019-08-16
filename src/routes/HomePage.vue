<template>
    <div>
        <nav  class="navbar navbar-expand navbar-light bg-light flex-column flex-md-row bd-navbar">
            <div class="navbar-nav-scroll">
                <ul class="navbar-nav mr-auto">
                    <li class="nav-item">
                        <a class="nav-link" href="/contact">Contact/Join Us</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="/contact">Advertise With Us</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="/contact">Check Previous Updates</a>
                    </li>
                </ul>
            </div>
        </nav>

        <div class="container">
            <h1 class="display-2">Welcome to Plannable</h1>
            <img class="img-fluid" src="../assets/cover.jpg" />
            <hr class="my-4" />
            <p>
                Provide students with free and handy tools to schedule their classes more
                efficiently.
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
            <div id="release-note" class="container"></div>
        </div>
    </div>
</template>

<script lang="ts" src='./HomePage.ts'>
</script>

<style scoped>
.bg {
    background-color: rgb(99, 34, 34);
}
</style>