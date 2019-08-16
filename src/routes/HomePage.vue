<template>
    <div>
        <transition name="fadeInDown">
            <nav class="navbar navbar-expand navbar-light bd-navbar flex-column flex-md-row ">
                <img class="img-fluid logo" src="../assets/cover.jpg" />
                <div class="navbar-nav-scroll ml-auto">
                    <ul class="navbar-nav">
                        <li class="nav-item">
                            <a class="nav-link" href="/contact">Contact/Join Us</a>
                        </li>
                        <li class="nav-item mx-3">
                            <a class="nav-link" href="/contact">Advertise With Us</a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" href="/contact">Check Previous Updates</a>
                        </li>
                    </ul>
                </div>
            </nav>
        </transition>

        <transition name="slide-fade">
            <div v-if="show" class="jumbotron">
                <h1 style="font-size:5vw">Welcome to Plannable</h1>
                <p class="lead" style="font-size:3vw">
                    Everything is Plannable
                </p>
                <!-- <hr class="my-4" /> -->

                <div class="d-flex flex-row select-school">
                    <select v-model="currentSelect" class="py-0 mx-1">
                        <option v-for="(item, index) in schoolNames" :key="index" :value="index">{{
                            item
                        }}</option>
                    </select>

                    <button class="btn btn-primary mx-1" @click="redirection">
                        Go to
                    </button>
                </div>
            </div>
        </transition>
        <div id="demo">
            <button v-on:click="show = !show">
                Toggle
            </button>
            <transition name="fade">
                <p v-if="show">hello</p>
            </transition>
        </div>
        <div id="release-note" class="container"></div>
    </div>
</template>

<script lang="ts" src='./HomePage.ts'>
</script>

<style scoped>
.logo {
    height: 15vh;
}
.jumbotron {
    background-color: #ffffff;
}
.select-school {
    margin-top: 15vh;
}
.lead {
    margin-left: 20px;
}
.slide-fade-enter-active {
    transition: all 1.5s ease;
}
.fadeInDown-fade-enter-active {
    transition: opacity 0.5s;
}
.fadeInDown-fade-enter {
    opacity: 0;
}
.slide-fade-enter {
    transform: translateX(-75px);
    opacity: 0;
}
</style>