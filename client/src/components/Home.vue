<script setup lang="ts">
import { ref, reactive, onBeforeMount } from 'vue';
import store from '../store';
import router from '../router';
import { ModeEditFilled, DateRangeFilled } from '@vicons/material';

const texts = reactive([] as Array<IText>);
const isLoaded = ref(false);

onBeforeMount(async () => {
  const data = await store.get('texts');
  Object.assign(texts, data);
  isLoaded.value = true;
  // console.log("data", data);
});

const openTextProps = async (id?: number) => {
  router.push(`/project/${id || ''}`);
};
</script>

<template>
  <n-card title="Projects" v-if="isLoaded" :bordered="false" class="minimal left">

    <template #header-extra v-if="store.hasRights()">
      <n-button icon-placement="left" type="primary" @click="openTextProps()">+ new</n-button>
    </template>

    <n-space vertical size="large">
      <n-space justify="space-between" v-for="(value, key) in texts" :key="key">
        <n-tooltip trigger="hover">
          <template #trigger>
            <n-radio :checked="value.id === store?.state?.user?.text_id"
              @change="store.setCurrentText(value.id, value.title)">
              {{ value.author }}.&nbsp;{{ value.title }}</n-radio>
          </template>
          {{ value.id === store?.state?.user?.text_id ? 'This is default project' : 'Click to make default' }}
        </n-tooltip>
        <n-button v-if="store.hasRights()" title="Text properties" secondary type="success"
          @click="openTextProps(value.id)">
          <template #icon>
            <n-icon color="gray" :component="ModeEditFilled" />
          </template>
        </n-button>
      </n-space>
    </n-space>

    <n-descriptions label-placement="top" bordered :column="3" size="small" style="margin-top: 2rem">
      <n-descriptions-item label="Client">{{ store?.version }}</n-descriptions-item>
      <n-descriptions-item label="Server">{{ store?.state?.user?.server }}</n-descriptions-item>
      <n-descriptions-item label="Commit" v-if="store?.state?.user?.commit">
        <n-space>
          <n-time v-if="store?.state.user?.unix" :time="store?.state.user.unix * 1000" type="relative"></n-time>
          <n-tooltip trigger="hover">
            <template #trigger>
              <n-button text size="small" type="error">
                <template #icon>
                  <n-icon color="gray" :component="DateRangeFilled" />
                </template>
              </n-button>
            </template>
            {{ store?.state.user?.unix ? new Date(store?.state.user.unix * 1000).toLocaleString() : '' }}
          </n-tooltip>
          <n-button text tag="a" :href="store.git + '/commit/' + store?.state.user.commit" target="_blank"
            type="primary">
            {{ store?.state.user.commit }}
          </n-button>
        </n-space>
      </n-descriptions-item>
    </n-descriptions>

    <!-- <n-divider /> -->
    <n-divider>
      <n-button text tag="a" href="https://icons8.com/icon/93125/quote" target="_blank" type="primary">Quote icon by
        Icons8</n-button>
    </n-divider>
  </n-card>
</template>

<style scoped>
a {
  color: #42b983;
}

label {
  margin: 0 0.5em;
  font-weight: bold;
}

code {
  background-color: #eee;
  padding: 2px 4px;
  border-radius: 4px;
  color: #304455;
}
</style>
