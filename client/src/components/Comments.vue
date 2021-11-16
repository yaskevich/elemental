<template>
  <h1>List of comments</h1>

  <div v-for="(value, key) in fruits" :key="key">{{value}}</div>

</template>

<script setup lang="ts">

// import { ref } from 'vue'

// defineProps<{ msg: string }>()

// const count = ref(0)
const fruits: string[] = ['Apple', 'Orange', 'Banana'];
</script>

<style scoped>

</style>
