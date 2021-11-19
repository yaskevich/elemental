<script setup lang="ts">
import { ref, reactive, onBeforeMount } from 'vue'
import store from '../store'

// defineProps<{ msg: string }>()

// const msg = "Smart Annotation Tool"

const data = ref();

onBeforeMount(async () => {
  data.value = await store.get('texts');
});

const count = ref(0)
</script>

<template>
  <!-- <h1>{{ msg }}</h1> -->
  <h3>Projects</h3>

  <!-- <p>See <code>README.md</code> for more information.</p> -->
  <div v-for="(value, key) in data" :key="key" style="padding:.5rem;" :title="value.meta">
    <n-text type="info">{{value.author}}</n-text>.&nbsp;
    «<n-text strong>{{value.title}}</n-text>»
  </div>
  <!-- <button type="button" @click="count++">count is: {{ count }}</button> -->

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
