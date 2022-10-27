<template>
  <n-card title="Change" class="minimal left" v-if="isLoaded">
    <n-space vertical>
      <n-tag><n-time :time="new Date(record?.created)" /></n-tag>
      <n-tag style="text-transform: capitalize;">{{ record?.table_name }} ID: {{ record?.record_id }}</n-tag>
      <n-tag>{{record?.user_id}}</n-tag>
    </n-space>
  </n-card>
</template>

<script setup lang="ts">
import { ref, reactive, onBeforeMount, h, DefineComponent, toRaw } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import { NTime } from 'naive-ui';
import store from '../store';
const vuerouter = useRoute();

const isLoaded = ref(false);
let id = Number(vuerouter.params.id);
const record = ref<IChange>();

onBeforeMount(async () => {
  const data = await store.get('change', String(id));
  console.log(data);
  record.value = data;

  //   logs.value = await store.get('logs', String(store?.state?.user?.text_id));
  //   const data = await store.get('users');
  //   users.value = Object.assign({}, ...data.map((x: any) => ({ [x.id]: x })));
  //   // console.log('data from server', logs.value);
  //   const texts = await store.get('texts', String(store?.state?.user?.text_id));
  //   Object.assign(scheme, Object.assign({}, ...texts.shift().scheme.map((x: any) => ({ [x.id]: x }))));
  isLoaded.value = true;
});
</script>
