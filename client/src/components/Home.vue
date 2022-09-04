<script setup lang="ts">

import { ref, reactive, onBeforeMount } from 'vue';
import store from '../store';
import router from '../router';
import { ModeEditFilled as SettingsIcon } from '@vicons/material';

interface IText {
  id: number;
  author: string;
  title: string;
  meta: string;
  grammar: boolean;
  comments: boolean;
  loaded: boolean;
}

const texts = reactive([] as Array<IText>);
// const showForm = ref(false);
const isLoaded = ref(false);
// const form = reactive({ author: '', title: '', meta: '', grammar: false, comments: false, loaded: false });

onBeforeMount(async () => {
  const data = await store.get('texts');
  Object.assign(texts, data);
  isLoaded.value = true;
  // console.log("data", data);
});

const openTextProps = async (id?: number) => {
  router.push(`/project/${id || ''}`);
};

// const saveText = async () => {
//   console.log('form', form);
//   const { data } = await store.post('text', form);
//   console.log('change text props', data);
//   if (data?.id) {
//     showForm.value = false;
//     texts.push({ ...form, id: data.id });
//   }
// };

const goToText = async (id: number, title: string) => {
  // console.log("go to text", id);
  // localStorage.setItem('text_id', String(id));
  if (id && store?.state?.user) {
    const { data } = await store.post('user/text', { id: id });
    // console.log('change text', data);
    if (data?.id) {
      store.state.user.text_id = id;
      store.state.user.text = data;
      document.title = title;
      // router.push(`/comments/${id}`);
    } else {
      console.error('error', data);
    }
  }
};

const state = store.state;

</script>

<template>
  <n-card title="Projects" v-if="isLoaded" :bordered="false" class="minimal left">
    <template #header-extra>
      <n-button icon-placement="left" type="primary" @click="openTextProps()">+ new</n-button>
    </template>
    <n-space vertical size="large">
      <n-space justify="space-between" v-for="(value, key) in texts" :key="key">
        <n-tooltip trigger="hover">
          <template #trigger>
            <n-radio
              :checked="value.id === store?.state?.user?.text_id"
              @change="goToText(value.id, value.title)"
            >{{ value.author }}.&nbsp;{{ value.title }}</n-radio>
          </template>
          {{ value.id === store?.state?.user?.text_id ? 'This is default project' : 'Click to make default' }}
        </n-tooltip>
        <!-- <n-button
          @click="openTextProps(value.id)"
          :title="value.meta"
          :type="value.id === store?.state?.user?.text_id ? 'info' : ''"
        >{{ value.author }}.&nbsp;{{ value.title }}</n-button>-->
        <!-- <n-text>{{ value.author }}.&nbsp;{{ value.title }}</n-text>
        -->
        <n-button title="Text properties" @click="openTextProps(value.id)">
          <template #icon>
            <n-icon color="gray">
              <settings-icon />
            </n-icon>
          </template>
        </n-button>
      </n-space>
    </n-space>

    <n-descriptions
      label-placement="top"
      bordered
      :column="3"
      size="small"
      style="margin-top:2rem;"
    >
      <n-descriptions-item label="Client">{{ store?.version }}</n-descriptions-item>
      <n-descriptions-item label="Server">{{ state?.user?.server }}</n-descriptions-item>
      <n-descriptions-item label="Commit" v-if="state?.user?.commit">
        <n-button
          text
          tag="a"
          :href="store.git + '/commit/' + state.user.commit"
          target="_blank"
          type="primary"
        >{{ state.user.commit }}{{ state.user?.unix ? ' • ' + (new Date(state.user.unix * 1000)).toLocaleDateString() : '' }}</n-button>
      </n-descriptions-item>
    </n-descriptions>

    <!-- <n-divider /> -->
    <n-divider>
      <n-button
        text
        tag="a"
        href="https://icons8.com/icon/93125/quote"
        target="_blank"
        type="primary"
      >Quote icon by Icons8</n-button>
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
