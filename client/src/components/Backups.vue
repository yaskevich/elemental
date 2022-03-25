<template>

  <div class="center-column">
    <div class="left-column">

      <n-space justify="center">
        <div>
          <h3>Backups</h3>
        </div>
        <div>
          <h3 style="margin-top:.7em;margin-left: 2em;">
            <n-button type="info" dashed @click="makeBackup">+ make</n-button>
          </h3>
        </div>
      </n-space>

      <div v-for="(filename, index) in backups" :key="index" style="padding:.5rem;">
        <n-button secondary type="primary" @click="downloadBackup(filename)">{{filename.split('.').shift()}}</n-button>
      </div>

    </div>
  </div>

</template>

<script setup lang="ts">

  import { ref, reactive, onBeforeMount } from 'vue';
  import { useMessage } from 'naive-ui';
  import store from '../store';

  const message = useMessage();
  const backups = reactive([] as Array<string>);

  const makeBackup = async () => {
    const data = await store.get('backup');
    // console.log(data);
    if (data?.error) {
      message.error(`Database backup error: ${data.error}`, { duration: 5000 });
    } else {
      message.info(`Database snapshot was succsesfully created! File ${data.file}`, { closable: true });
      if (!backups.includes(data.file)){
        backups.unshift(data.file);
      }
    }
  };

  const downloadBackup = async(filename) => {
    // console.log(filename);
    const result = await store.getFile('backupfile', filename);
    if (result) {
      message.error("Download error!", { duration: 5000 });
    }
  };

  onBeforeMount(async () => {
    const data = await store.get('backups');
    Object.assign(backups, data.reverse());
  });

</script>
