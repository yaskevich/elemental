<template>

  <h1>Tags</h1>

  <n-button type="info" dashed @click="addTag">Create new tags +</n-button>
  <n-divider style="width:300px;text-align: center; margin:auto;padding:1rem;" />
  <div v-if="!tags.length">
    <n-text type="error">There are no tags!</n-text>
  </div>
  <div v-for="item in tags" :key="item.id" style="padding:.5rem;">
    {{item.en}} | {{item.ru}}
  </div>

</template>

<script setup lang="ts">

  import store from '../store';
  import { ref, reactive, onBeforeMount } from 'vue';

  const tags = reactive([]);
  onBeforeMount(async () => {
    const data = await store.get('tags');
    Object.assign(tags, data);
    console.log('data from server', data);
  });

  const addComment = () => {
    console.log('create tag');
  };

</script>

<style scoped>

</style>
