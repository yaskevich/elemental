<template>

  <h3>Tags</h3>
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
      <n-space vertical>
        <n-input-group v-for="item in tags" :key="item.id" style="display:block;">
          <n-space justify="space-between">
            <div>
            <n-input autosize v-model:value="item.en" placeholder="English title" />
            <n-input autosize v-model:value="item.ru" placeholder="Russian title" />
            </div>
            <n-button type="primary" ghost @click="editTag(item)">Save</n-button>
          </n-space>
        </n-input-group>
      </n-space>
    </div>
  </div>

</template>

<script setup lang="ts">

  import store from '../store';
  import { ref, reactive, onBeforeMount } from 'vue';

  interface ITag {
    id?: number,
    en: string,
    ru: string,
  };

  const newTag = reactive({ en: '', ru: '' });
  const tags:Array<ITag> = reactive([] as Array<ITag>);

  onBeforeMount(async () => {
    const data = await store.get('tags');
    Object.assign(tags, data);
    console.log('data from server', data);
  });

  const editTag = async (tag:ITag) => {
    console.log('edit tag', tag);
    const params: ITag = { } as ITag;
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
