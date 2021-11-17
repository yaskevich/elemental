<template>
  <h1>List of comments</h1>

  <div v-for="(value, key) in fruits" :key="key" style="padding:.5rem;">
    <router-link :to="'/comment/'+key" style="text-decoration: none;">
      {{value}}
    </router-link>
  </div>

</template>

<script setup lang="ts">
import store from '../store'
import { ref, reactive, onBeforeMount } from 'vue'
// import { ref } from 'vue'

// defineProps<{ msg: string }>()
onBeforeMount(async () => {
  const data = await store.get('test');
  console.log("data from server", data);
});
// const count = ref(0)
const fruits: string[] = ['Apple', 'Orange', 'Banana'];
</script>

<style scoped>

</style>
