<template>

  <h1>Tags</h1>
  <n-space vertical>
    <n-input style="min-width:250px;" autosize v-model:value="newTag.en" type="text" placeholder="English title" />
    <n-input autosize style="min-width:250px;" v-model:value="newTag.ru" type="text" placeholder="Russian title" />
    <n-button type="info" dashed @click="editTag(newTag)">Create new tag +</n-button>
  </n-space>
  <n-divider style="width:300px;text-align: center; margin:auto;padding:1rem;" />
  <div v-if="!tags.length">
    <n-text type="error">There are no tags!</n-text>
  </div>
  <div class="center-column">
    <div class="left-column">
      <div v-for="item in tags" :key="item.id" style="padding:.5rem;margin:0 auto;display:block;">
        <n-input-group>
          <n-input autosize v-model:value="item.en" placeholder="English title" />
          <n-input autosize v-model:value="item.ru" placeholder="Russian title" />
          <n-button type="primary" ghost @click="editTag(item)">Save</n-button>
        </n-input-group>
      </div>
    </div>
  </div>

</template>

<script setup lang="ts">

  import store from '../store';
  import { ref, reactive, onBeforeMount } from 'vue';

  const newTag = reactive({ en: '', ru: '' });
  const tags = reactive([]);
  onBeforeMount(async () => {
    const data = await store.get('tags');
    Object.assign(tags, data);
    console.log('data from server', data);
  });

  const editTag = async tag => {
    console.log('edit tag', tag);
    const params = {};
    if (tag?.id) {
      params.id = tag.id;
    }
    params.en = tag.en;
    params.ru = tag.ru;
    const result = await store.post('tag', params);
    if (result?.data?.id) {
      params.id = result.data.id;
      if (!tag?.id) {
        tags.push(params);
        newTag.en = newTag.ru = '';
      }
    } else {
      console.log('error', result);
    }
  };

</script>

<style scoped>

</style>
