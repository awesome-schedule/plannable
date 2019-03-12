<template>
    <table style="width:100%">
        <tr style="width:100%">
            <td style="width:5%">
                <div class="grid-container time mb-3" v-bind:style="{
        'grid-template-columns': 'auto',
        'width' : '100%', 
        'grid-template-rows': '48px '
                            + heightInfo[0] + 'px ' 
                            + heightInfo[1] + 'px ' 
                            + heightInfo[2] + 'px '
                            + heightInfo[3] + 'px '
                            + heightInfo[4] + 'px '
                            + heightInfo[5] + 'px '
                            + heightInfo[6] + 'px '
                            + heightInfo[7] + 'px '
                            + heightInfo[8] + 'px '
                            + heightInfo[9] + 'px '
                            + heightInfo[10] + 'px '
                            + heightInfo[11] + 'px '
                            + heightInfo[12] + 'px '
                            + heightInfo[13] + 'px '
                            + heightInfo[14] + 'px '
                            + heightInfo[15] + 'px '
                            + heightInfo[16] + 'px '
                            + heightInfo[17] + 'px '
                            + heightInfo[18] + 'px '
                            + heightInfo[19] + 'px '
                            + heightInfo[20] + 'px '
                            + heightInfo[21] + 'px '
                            + heightInfo[22] + 'px '

     }">
        <div></div>
        <div v-for="hour in hours" :key="hour">{{hour}}</div>
     </div>
            </td>
            <td>
            <div class="grid-container main mb-3" v-bind:style="{
        'grid-template-columns': '20% 20% 20% 20% 20%',
        'position': 'relative', 
        'grid-template-rows': '48px '
                            + heightInfo[0] + 'px ' 
                            + heightInfo[1] + 'px ' 
                            + heightInfo[2] + 'px '
                            + heightInfo[3] + 'px '
                            + heightInfo[4] + 'px '
                            + heightInfo[5] + 'px '
                            + heightInfo[6] + 'px '
                            + heightInfo[7] + 'px '
                            + heightInfo[8] + 'px '
                            + heightInfo[9] + 'px '
                            + heightInfo[10] + 'px '
                            + heightInfo[11] + 'px '
                            + heightInfo[12] + 'px '
                            + heightInfo[13] + 'px '
                            + heightInfo[14] + 'px '
                            + heightInfo[15] + 'px '
                            + heightInfo[16] + 'px '
                            + heightInfo[17] + 'px '
                            + heightInfo[18] + 'px '
                            + heightInfo[19] + 'px '
                            + heightInfo[20] + 'px '
                            + heightInfo[21] + 'px '
                            + heightInfo[22] + 'px '

     }" id="grid">
    <div class="day"><br>Monday</div><div class="day"><br>Tuesday</div><div class="day"><br>Wednesday</div><div class="day"><br>Thursday</div><div 
    class="day"><br>Friday</div>
    <div v-for="item in items" :key="item" style="z-index:1"></div>

    <div style="margin-top:48px; position:absolute; width:20%; height:25px; background-color:green; z-index:2">
    </div>

    </div>
    
            </td>
        </tr>
    </table>
    
</template>

<script>
import Course from './Course.vue';
import Schedule from '../models/Schedule.js';

export default {
    name: 'GridSchedule',
    props: {
        courses: Schedule
    },

    components: {
        Course
    },

    data : function(){
        let partial = 25;
        let full = 60;

        let arr = [];
        for(let i = 0; i < 115; i++){
            arr.push(i + 1);
        }

        let time = [];
        for(let i = 8; i < 19; i++){
            time.push((i / 10 > 0 ? i : 0 + i) + ': 00');
            time.push((i / 10 > 0 ? i : 0 + i) + ': 30');
        }

        time.push('19: 00');

        let height = [];
        for(let i = 0; i < 23; i++){
            height.push(partial);
        }

        return{
            partialHeight : partial,
            fullHeight : full,
            items : arr,
            hours : time,
            heightInfo : height,
        }   
    },
    
    computed : {
        heightInfo2 : function(){

        }
    }
}


</script>

<style scoped>
    .grid-container {
    display: grid;
    grid-gap: 0px;
    background-color: white;
    
    padding: 0px;
    }

    .main{
        border-right: 0.7px solid #e5e3dc;
        border-bottom:  0.7px solid #e5e3dc;
    }

    .main > div {
    background-color: rgba(255, 255, 255, 0.8);
    padding: 0px 0;
    font-size: 10px;
    border-left: 0.7px solid #e5e3dc;
    border-top: 0.7px solid #e5e3dc;
    }

    .time{

    }

    .time > div {
        text-align : right;
        font-size: 10px;
    }

    .item1 {
    grid-column: 1 / 3;

    }

    .day{
        text-align: center;
        border-top: 40%;
        vertical-align: middle;
    }

    .time{
        
    }
</style>
