<template>
    <div v-bind:style="{
        'margin-top': this.startPx,
        'position': 'absolute',
        'width': '20%',
        'height': this.endPx - this.startPx,
        'background-color': 'green',
        'z-index': '2'
        }">{{this.course}}.title
    </div>
</template>

<script>
import {Course} from '../models/CourseRecord.js';
export default {
    name : 'CourseBlock',
    props : {
        course : Course,
        heightInfo : Array,
    },
    computed : {
        startPx : function(){
            let start = 48;
            let t = this.course.start.split(':');
            let temp = (parseFloat(t[0]) - 8) * 2;
            for(let i = 0; i < temp; i++){
                start += this.heightInfo[i];
            }
            if(parseInt(t[1]) >= 30){
                start += 60;
                if(parseInt(t[1]) > 30){
                    start += (parseFloat(t[1]) - 30) / 30 * 60;
                }
            }
            return start;
        },

        endPx : function(){
            let end = 48;
            let t = this.course.end.split(':');
            let temp = (parseFloat(t[0]) - 8) * 2;
            for(let i = 0; i < temp; i++){
                end += this.heightInfo[i];
            }
            if(parseInt(t[1]) >= 30){
                end += 60;
                if(parseInt(t[1]) > 30){
                    end += (parseFloat(t[1]) - 30) / 30 * 60;
                }
            }
            return end;
        }
    }
}
</script>

<style>

</style>
