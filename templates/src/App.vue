<template>
  <div id="app">
    <!-- <Active></Active> -->
    <Schedule></Schedule>
  </div>
</template>

<script>
import Schedule from './components/Schedule.vue';
import Active from './components/Active';

export default {
    name: 'app',
    components: {
        Active, Schedule
    },
    data() {
        return {
            api: 'http://localhost:8000/api',
            semesters: []
        };
    },
    mounted() {
        this.$http.get(`${this.api}/semesters`).then(res => {
            console.log(res);
        });
    }
};
</script>

<style>
#app {
    font-family: 'Avenir', Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-align: center;
    color: #2c3e50;
    margin-top: 60px;
}
</style>
