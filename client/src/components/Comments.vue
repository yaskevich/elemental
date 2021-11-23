<template>

  <h1>Comments</h1>
  <div v-if="!id">
    <n-text type="error">Select specific text before (at Home screen)!</n-text>
  </div>
  <n-button type="info" dashed @click="addComment">Create new comment +</n-button>
  <n-divider style="width:300px;text-align: center; margin:auto;padding:1rem;"/>
  <div v-for="item in comments" :key="item.id" style="padding:.5rem;">
    {{item.num_id}} ▪
    <router-link :to="'/comment/'+item.id" style="text-decoration: none;">
      {{item.title}} <span v-if="item.published" style="margin-left:10px;color:blue;">✓</span>
    </router-link>
  </div>

</template>

<script setup lang="ts">

  import store from '../store';
  import { ref, reactive, onBeforeMount } from 'vue';
  import router from '../router';
  import { useRoute } from 'vue-router';

  const vuerouter = useRoute();
  const id = vuerouter.params.id || store.state.user.text_id;

  // defineProps<{ msg: string }>()

  const comments = reactive([]);
  onBeforeMount(async () => {
    if (id) {
      localStorage.setItem('text_id', id);
      const data = await store.get('comments/'+id);
      Object.assign(comments, data);
      console.log('data from server', data);
    }
  });

  const addComment = () => {
      router.push('/comment');
  }

  // const count = ref(0)
  // const fruits: string[] = ['Apple', 'Orange', 'Banana'];

</script>

<style scoped>

</style>
