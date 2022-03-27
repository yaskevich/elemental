<script setup lang="ts">

  import { ref, reactive, onBeforeMount } from 'vue';
  import store from '../store';
  import router from '../router';
  import { useRoute } from 'vue-router';

  const vuerouter = useRoute();
  const id = vuerouter.params.id;
  const textInfo = reactive({});

  onBeforeMount(async () => {
    const data = await store.get('texts');
    Object.assign(textInfo, data.shift());
  });

  const publishText = async() => {
    console.log("publish text", id);
  };

</script>

<template>

  <h3>Project</h3>
  <div class="center-column">
    <div class="left-column">
      <h4>{{textInfo.author}}. {{textInfo.title}}</h4>
      <div style="color:gray;margin-bottom:2rem;">{{textInfo.meta}}</div>

      <div>The text is <span v-if="!textInfo.loaded">NOT</span> loaded into the database.</div>

      <div>The grammar tagging UI is <span v-if="!textInfo.grammar">NOT</span> enabled.</div>
      <div>The comments UI is <span v-if="!textInfo.comments">NOT</span> enabled.</div>

      <n-button type="info" @click="publishText" style="margin-top:1rem;">Publish</n-button>

    </div>
  </div>

</template>

<style scoped>

</style>
