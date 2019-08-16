<template>
    <div class="text-center">
        <transition name="slide-fade-down">
            <nav
                v-if="show"
                class="navbar navbar-expand navbar-light bd-navbar flex-column flex-md-row "
            >
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
            <div v-if="show" class="jumbotron float-left">
                <h1 class="display-3">Welcome to Plannable</h1>
                <p class="lead text-left">
                    Everything is Plannable
                </p>

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
        <div v-if="show" class="float-left border">
            <img class="img-fluid logo" src="../assets/cover.jpg" />
            video here
        </div>

        <!-- <div id="release-note" class="container"></div> -->
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
.slide-fade-enter-active,
.slide-fade-down-enter-active {
    transition: all 1.5s ease;
}

.slide-fade-enter {
    transform: translateX(-75px);
    opacity: 0;
}

.slide-fade-down-enter {
    transform: translateY(-75px);
    opacity: 0;
}
</style>