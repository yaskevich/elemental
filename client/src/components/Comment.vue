<template>
  <h1>Single comment</h1>
  <div>
    <div style="max-width:300px;margin: 0 auto;">
      <Tiptap/>
    </div>
  </div>

</template>

<script setup lang="ts">
import store from '../store'
import { ref, reactive, onBeforeMount } from 'vue'
import Tiptap from './Tiptap.vue'
// import { ref } from 'vue'

// defineProps<{ msg: string }>()
// onBeforeMount(async () => {
//   const data = await store.get('test');
//   console.log("data from server", data);
// });
// const count = ref(0)
</script>

<style scoped>

</style>
