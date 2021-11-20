<template>
  <h1>List of comments</h1>

  <div v-for="item in comments" :key="item.id" style="padding:.5rem;">
    <router-link :to="'/comment/'+item.id" style="text-decoration: none;">
      {{item.title}} <span v-if="item.published" style="margin-left:10px;color:blue;">✓</span>
    </router-link>
  </div>

</template>

<script setup lang="ts">
import store from '../store'
import { ref, reactive, onBeforeMount } from 'vue'
// import { ref } from 'vue'

// defineProps<{ msg: string }>()

const comments = reactive([]);
onBeforeMount(async () => {
  const data = await store.get('comments');
  Object.assign (comments,  data);
  console.log("data from server", data);
});
// const count = ref(0)
// const fruits: string[] = ['Apple', 'Orange', 'Banana'];
</script>

<style scoped>

</style>
