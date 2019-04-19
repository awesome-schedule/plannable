<template>
    <div class="info-panel"></div>
</template>

<script>
import Vue from 'vue';
export default Vue.component('Information', {});
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
    background-color: white;
}
</style>
