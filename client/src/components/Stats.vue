<template>
  <n-card title="Stats" :bordered="false" class="minimal left">
    <n-space vertical v-if="isLoaded">
      <!-- {{ stats }} -->
      <n-descriptions label-placement="left" bordered :column="1">
        <n-descriptions-item>
          <template #label> Comments </template>
          {{ data?.stats?.comments?.total }} ({{ data?.stats?.comments?.ready }}/{{ data?.stats?.comments?.draft }})
        </n-descriptions-item>
        <n-descriptions-item>
          <template #label> Changes (total) </template>
          {{ data?.stats?.changes?.map((x: any) => x.count).reduce((a: any, b: any) => a + b, 0) }}
        </n-descriptions-item>

        <n-descriptions-item v-for="user in data?.stats.changes">
          <template #label>
            • {{ data?.users[user?.user_id]?.firstname + ' ' + data?.users[user?.user_id]?.lastname }}
          </template>
          {{ user?.count }}
        </n-descriptions-item>

        <n-descriptions-item>
          <template #label> Words (total) </template>
          {{ data?.stats?.words?.map((x: any) => x.count).reduce((a: any, b: any) => a + b, 0) }}
        </n-descriptions-item>

        <n-descriptions-item v-for="word in data?.stats.words">
          <template #label>
            • with{{ word?.qty ? ' ' + word?.qty : 'out' }} comment{{ word?.qty === 1 ? '' : 's' }}
          </template>
          {{ word?.count }}
        </n-descriptions-item>
      </n-descriptions>
      <n-divider></n-divider>

      <div>
        <n-h4>Tags</n-h4>
        <n-space vertical>
          <n-space v-for="tag in data?.stats?.tags" justify="space-between">
            <n-space v-if="tag?.tags?.length">
              <n-tag type="success" v-for="tid in tag.tags">{{ data.tags?.[tid][lang] }}</n-tag>
            </n-space>
            <div v-else>no tags</div>
            <n-tag>{{ tag.qty }}</n-tag>
          </n-space>
        </n-space>
      </div>
    </n-space>
    <n-divider></n-divider>
  </n-card>
</template>

<script setup lang="ts">
import { ref, reactive, onBeforeMount } from 'vue';
import store from '../store';
import router from '../router';
const data = reactive({} as any);
const isLoaded = ref(false);
const lang = store?.state?.user?.text?.lang.slice(0, 2) || 'en';

onBeforeMount(async () => {
  const [stats, users, issues, tags] = await Promise.all([
    store.get('stats', String(store?.state?.user?.text_id)),
    store.get('users'),
    store.get('issues'),
    store.get('tags'),
  ]);
  Object.assign(data, {
    stats,
    users: store.convertArrayToObject(users),
    issues,
    tags: store.convertArrayToObject(tags) as keyable,
  });
  isLoaded.value = true;
  // console.log("data", data);
});
</script>
