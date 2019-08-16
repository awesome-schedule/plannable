<template>
    <div>
        <transition name="slide-fade-down">
            <nav
                v-if="show"
                id="navbar"
                class="navbar fixed-top navbar-expand navbar-light bd-navbar bg-white flex-column flex-md-row"
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

        <div class="clearfix" :style="navbarHeight">
            <transition name="slide-fade">
                <div v-if="show" class="jumbotron float-left ">
                    <h1 class="display-3 text-center">Welcome to Plannable</h1>
                    <p class="lead text-left">
                        Everything is Plannable
                    </p>

                    <div class="d-flex flex-row select-school">
                        <select v-model="currentSelect" class="py-0 mx-1">
                            <option
                                v-for="(item, index) in schoolNames"
                                :key="index"
                                :value="index"
                                >{{ item }}</option
                            >
                        </select>

                        <button class="btn btn-primary mx-1" @click="redirection">
                            Go to
                        </button>
                    </div>
                </div>
            </transition>
            <transition name="slide-fade-left">
                <div v-if="show" class="float-left embed-responsive embed-responsive-21by9">
                    <embed class="d-inline embed-responsive-item" />
                    afdas
                </div>
            </transition>
        </div>

        <!-- <div id="release-note" class="container"></div> -->
        <section class="row no-gutters text-center ">
            <div class="col-md-6 bg-light">
                <span class="align-middle">Auto-Generating</span>
            </div>
            <div class="col-md-6">
                <img class="img-fluid " src="../assets/generate_class.gif" />
            </div>
        </section>
        <section class="row no-gutters text-center">
            <div class="col-md-6">
                <img class="img-fluid " src="../assets/generate_class.gif" />
            </div>
            <div class="col-md-6 bg-light">
                Auto-Generating
            </div>
        </section>
    </div>
</template>

<script lang="ts" src='./HomePage.ts'>
</script>

<style scoped>
/* .navbar {
    background-color: #17a2b8;
} */
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
.slide-fade-down-enter-active,
.slide-fade-left-enter-active {
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

.slide-fade-left-enter {
    transform: translateX(200px);
    opacity: 0;
}
</style>