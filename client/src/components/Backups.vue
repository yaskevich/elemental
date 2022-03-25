<template>
  <div class="center-column">
    <div class="left-column">
    <n-space justify="center">
      <div>
        <h3>Backups</h3>
      </div>
      <div>
        <h3 style="margin-top:.7em;margin-left: 2em;">
          <n-button type="info" dashed @click="" >+ make</n-button>
        </h3>
      </div>
    </n-space>


  <div>
    <n-button v-for="(filename, index) in backups" :key="index">{{filename}}</n-button>
  </div>
</div>
</div>

</template>

<script setup lang="ts">

  import { ref, reactive, onBeforeMount } from 'vue';
  import store from '../store';

  const backups = reactive([] as Array<string>);

  onBeforeMount(async () => {
    const data = await store.get('backups');
    Object.assign(backups, data);
  });

</script>
