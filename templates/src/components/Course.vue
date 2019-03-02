<template>
    <li class="single-event" v-bind:data-start="start_time" v-bind:data-end="end_time" data-content="event-abs-circuit" data-event="event-1">
        <a href="#0">
            <em class="event-name">Abs Circuit</em>
        </a>
    </li>
</template>

<script>
export default {
    name : 'Course',
    props: {
        day : String,
        start_time : String,
        end_time : String,
    }, 
    data(){
        return {
            department : "",
            number : "",
            section : "",
            type : "",
            units : "",
            instructor : "",
            days : "",
            room : "",
            title : "",
            topic : "",
            status : "",
            enrollment : "",
            enrollment_limit : "",
            wait_list : "",
            description : "",
        }
    }
}
</script>

<style>

</style>
