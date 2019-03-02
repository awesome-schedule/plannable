<template>
    <li class="single-event" v-bind:data-start="start_time" v-bind:data-end="end_time" v-bind:data-content="title" v-bind:data-event="color_type">
        <a href="#0">
            <em class="event-name">{{title}}</em>
        </a>
    </li>
</template>

<script>
export default {
    name : 'Course',
    props: {
        department : String,
        number : String,
        section : String,
        type : String,
        units : Number,
        instructor : String,
        days : String,
        room : String,
        title : String,
        topic : String,
        status : String,
        enrollment : Number,
        enrollment_limit : Number,
        wait_list : Number,
        description : String,
        weekdays : Array,
        start_time : String,
        end_time : String,
        color_type : String,
    }, 
    data(){
        return {
            
        }
    }
}
</script>

<style>

</style>
