<template>
    <div class="info-panel">
        <h2>Website Guide</h2>
        <hr />
        <div class="container">
            <div class="general information">
                <span><h2>General Information</h2></span>
                <p>
                    This is a website which helps UVa students to schedule their classes more
                    efficiently. Get your class selection done with the searching field and
                    customize them with filters. The website can generate all possible schedules
                    according to your requirements.
                </p>
            </div>
        </div>
        <div class="container">
            <div class="basic operations">
                <span><h4>Basic Operations</h4></span>
                <p>
                    Adding classes by searching class number, department, or key words.
                </p>
            </div>
        </div>
        <div class="bd-example">
            <div id="carouselExampleCaptions" class="carousel slide" data-ride="carousel">
                <ol class="carousel-indicators">
                    <li
                        data-target="#carouselExampleCaptions"
                        data-slide-to="0"
                        class="active"
                    ></li>
                    <li data-target="#carouselExampleCaptions" data-slide-to="1"></li>
                    <li data-target="#carouselExampleCaptions" data-slide-to="2"></li>
                </ol>
                <div class="carousel-inner">
                    <div class="carousel-item active">
                        <img src="images/zhenhong.jpg" class="d-block w-100" alt="First slide" />
                        <div class="carousel-caption d-none d-md-block">
                            <h5>First slide label</h5>
                            <p>Nulla vitae elit libero, a pharetra augue mollis interdum.</p>
                        </div>
                    </div>
                    <div class="carousel-item">
                        <img src="images/zhenhong.jpg" class="second-slide" alt="Second slide" />
                        <div class="carousel-caption d-none d-md-block">
                            <h5>Second slide label</h5>
                            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
                        </div>
                    </div>
                    <div class="carousel-item">
                        <img src="images/zhenhong.jpg" class="third-slide" alt="Third slide" />
                        <div class="carousel-caption d-none d-md-block">
                            <h5>Third slide label</h5>
                            <p>Praesent commodo cursus magna, vel scelerisque nisl consectetur.</p>
                        </div>
                    </div>
                </div>
                <a
                    class="carousel-control-prev"
                    href="#carouselExampleCaptions"
                    role="button"
                    data-slide="prev"
                >
                    <span class="carousel-control-prev-icon" aria-hidden="true"></span>
                    <span class="sr-only">Previous</span>
                </a>
                <a
                    class="carousel-control-next"
                    href="#carouselExampleCaptions"
                    role="button"
                    data-slide="next"
                >
                    <span class="carousel-control-next-icon" aria-hidden="true"></span>
                    <span class="sr-only">Next</span>
                </a>
            </div>
        </div>
    </div>
</template>

<script>
import Vue from 'vue';
export default Vue.component('Information', {});
$('#myCarousel').carousel();
</script>

<style scoped>
.info-panel {
    width: 97vw;
    height: 100vh;
    left: 3vw;
    position: fixed;
    top: 0;
    z-index: 1000;
    overflow-y: auto;
    background-color: rgb(244, 247, 248);
}
.container {
    display: flex;
    background-color: rgb(136, 206, 238);
    margin: 10px;
    padding: 20px;
}

.container > div {
    font-size: 20px;
    font-family: 'Times New Roman', Times, serif;
}
/* .carousel-inner > .item > img {
    min-height: 300px;
    max-height: 300px;
    width: 100%;
} */
</style>
