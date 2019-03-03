<template>
    <li class="single-event" v-bind:data-start="start_time" v-bind:data-end="end_time" v-bind:data-content="title" v-bind:data-event="color_type" v-on:click="pop">
        <!-- <a href="#0"> -->
            
            <em style="margin-left:5%;font-style:normal;font-size: 1rem;">{{title}}</em><br>
            <em style="margin-left:5%;font-style:normal;font-size: 0.9rem;color:#e0e0de;line-height:1px">{{start_time}}-{{end_time}}</em><br>
            <em style="margin-left:5%;font-style:normal;font-size: 0.9rem;color:#e0e0de;line-height:1px">{{room}}</em>
        <!-- </a> -->
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
    },
    methods :{
        pop : function(event){
            alert(this.title);
        }
    }
}
</script>

<style>

</style>
