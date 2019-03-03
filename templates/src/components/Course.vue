<template>
    <li class="single-event" v-bind:data-start="start_time" v-bind:data-end="end_time" v-bind:data-content="title" v-bind:data-event="color_type" v-on:click="pop" data-toggle="modal">
        <!-- <a href="#0"> -->
            
            <em style="margin-left:5%;font-style:normal;font-size: 1rem;">{{title}}</em><br>
            <em style="margin-left:5%;font-style:normal;font-size: 0.9rem;color:#e0e0de;line-height:1px">{{start_time}}-{{end_time}}</em><br>
            <em style="margin-left:5%;font-style:normal;font-size: 0.9rem;color:#e0e0de;line-height:1px">{{room}}</em>
        <!-- </a> -->

        <div class="modal fade" id="exampleModal" tabindex="-1" role="dialog" aria-labelledby="exampleModalLabel" aria-hidden="true">
        <div class="modal-dialog" role="document">
            <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="exampleModalLabel">{{title}}</h5>
                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                <span aria-hidden="true">&times;</span>
                </button>
            </div>
            <div class="modal-body">
                ...
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
            </div>
            </div>
        </div>
        </div>
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
            alert(this.description);
        }
    }
}
</script>

<style>

</style>
