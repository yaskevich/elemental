<template>
  <div style="max-width:300px;margin: 0 auto;text-align: left;">

  <h2>{{entry.title}}</h2>
  <div>
    <div style="">
      <p style="margin-top:-1rem;">Translation: <span style="font-style:italic;">{{entry.trans}}</span></p>
      <h4>Brief comment</h4>
      <div v-html="entry.brief_html"></div>
      <h4>Full comment</h4>
      <div v-html="entry.content_html"></div>
      <n-divider style=""/>
      № {{entry.num_id}}
    </div>
  </div>
  </div>

</template>

<script setup lang="ts">

  import store from '../store';
  import { ref, reactive, onBeforeMount } from 'vue';
  import { useRoute } from 'vue-router';
  // defineProps<{ msg: string }>()

  const vuerouter = useRoute();
  const id = vuerouter.params.id;
  const entry = reactive({});

  onBeforeMount(async () => {
    if (id) {
      const data = await store.get(`comment/${id}`);
      console.log('data from server', data);
      if (data.length) {
        console.log('data', data);
        Object.assign(entry, data[0]);
      }
    }
  });

</script>

<style scoped>

</style>
