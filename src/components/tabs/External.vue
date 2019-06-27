<template>
    <nav id="external-bar">
        <h2 class="my-4">This page is intentionally left blank</h2>
        <div class="w-100">
            <img src="../../assets/placeholder.jpg" class="w-75" alt="" />
        </div>
    </nav>
</template>

<script lang="ts">
import Vue from 'vue';
export default Vue.extend({});
</script>

<style scoped>
#external-bar {
    margin-left: 3vw;
    width: 100%;
    text-align: center;
}
@media (max-width: 600px) {
    #external-bar {
        margin-left: 10vw;
    }
}
</style>
