<template>

  <h1>Issues</h1>

  <n-space vertical>
    <n-input style="min-width:250px;" autosize v-model:value="newIssue.en" type="text" placeholder="English title" />
    <n-input autosize style="min-width:250px;" v-model:value="newIssue.ru" type="text" placeholder="Russian title" />
    <n-button type="info" dashed @click="editIssue(newIssue)">Create new issue +</n-button>
  </n-space>
  <n-divider style="width:300px;text-align: center; margin:auto;padding:1rem;" />
  <div v-if="!issues.length">
    <n-text type="error">There are no issues!</n-text>
  </div>
  <div v-for="item in issues" :key="item.id" style="padding:.5rem;margin: 0 auto;display: table;">
    <n-input-group>
      <n-input autosize v-model:value="item.en" placeholder="English title" />
      <n-input autosize v-model:value="item.ru" placeholder="Russian title" />
      <n-button type="primary" ghost @click="editIssue(item)">Save</n-button>
    </n-input-group>
  </div>

</template>

<script setup lang="ts">

  import store from '../store';
  import { ref, reactive, onBeforeMount } from 'vue';

  const newIssue = reactive({ en: '', ru: '' });
  const issues = reactive([]);
  onBeforeMount(async () => {
    const data = await store.get('issues');
    Object.assign(issues, data);
    console.log('data from server', data);
  });

  const editIssue = async issue => {
    console.log('edit issue', issue);
    const params = {};
    if (issue?.id) {
      params.id = issue.id;
    }
    params.en = issue.en;
    params.ru = issue.ru;
    const result = await store.post('issue', params);
    if (result?.data?.id) {
        params.id = result.data.id;
        if (!issue?.id) {
          issues.push(params);
          newIssue.en = newIssue.ru = '';
        }
    } else {
        console.log('error', result);
    }

  };

</script>

<style scoped>

</style>
