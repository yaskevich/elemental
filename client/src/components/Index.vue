<template>
  <n-card title="Semanitc Index" :bordered="false" class="minimal left">
    <n-space vertical>
      <template v-for="(val, key) in objects">
        <n-button @auxclick="store.openInWindow(`/comment/${key}`)" @click="$router.push(`/comment/${key}`)"
          >Comment {{ key }}</n-button
        >
        <n-space>
          <n-tag v-for="word in val" :type="word ? 'success' : 'error'">
            <template v-if="word">{{ word }}</template>
            <n-icon :component="ErrorFilled" v-else />
          </n-tag>
        </n-space>
      </template>
    </n-space>
  </n-card>
</template>

<script setup lang="ts">
import { ref, reactive, onBeforeMount } from 'vue';
import store from '../store';
import router from '../router';
import { ErrorFilled } from '@vicons/material';
const objects = reactive({});

onBeforeMount(async () => {
  const data = await store.get('index', String(store?.state?.user?.text_id), { name: 'name' });
  //   console.log(data);
  Object.assign(objects, data);
  //   isLoaded.value = true;
  // console.log("data", data);
});
</script>
