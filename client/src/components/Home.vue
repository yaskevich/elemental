<script setup lang="ts">
import { ref, reactive, onBeforeMount } from 'vue'
import store from '../store'
import router from '../router';

// defineProps<{ msg: string }>()

// const msg = "Smart Annotation Tool"

const data = ref();

onBeforeMount(async () => {
  data.value = await store.get('texts');
});

const goToText = (id: number) => {
  // console.log("go to text", id);
  localStorage.setItem('text_id', String(id));
  router.push(`/comments/${id}`);
  store.state.user.text_id = id;
}

const state = store.state;
</script>

<template>
  <!-- <h1>{{ msg }}</h1> -->
  <h3>Projects</h3>
  <div class="center-column">
    <div class="left-column">
  <!-- <p>See <code>README.md</code> for more information.</p> -->
  <div v-for="(value, key) in data" :key="key" style="padding:.5rem;" :title="value.meta">
     <!-- <n-button type="info">Info</n-button> -->
    <n-button @click="goToText(value.id)" :type="value.id === store.state.user.text_id ? 'info': ''">
      {{value.author}}.&nbsp;{{value.title}}
      <!-- <n-text type="info">{{value.author}}</n-text>.&nbsp;
      «<n-text strong>{{value.title}}</n-text>» -->
    </n-button>
  </div>
  <!-- <button type="button" @click="count++">count is: {{ count }}</button> -->
  <n-divider style="width:300px;text-align: center; margin:auto;padding:1rem;" />
  <n-descriptions label-placement="top" bordered :column="3" size="small">
    <n-descriptions-item label="Client">{{store.version}}</n-descriptions-item>
    <n-descriptions-item label="Server">{{state.user.server}}</n-descriptions-item>
    <n-descriptions-item label="Commit"><a type="primary" :href="'https://github.com/yaskevich/persona/commit/' + state.user.commit" target="_blank">{{state.user.commit}}</a></n-descriptions-item>

  </n-descriptions>
</div>
</div>
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
