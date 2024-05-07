<template>
  <n-card title="Backups" v-if="isLoaded" :bordered="false" class="minimal left">
    <template #header-extra v-if="store.hasRights()">
      <n-button :loading="processing" icon-placement="left" type="primary" @click="makeBackup">+ make</n-button>
    </template>

    <div style="margin: 0 auto;" v-if="!backups.length">
      <n-alert title="No backups!" type="warning">There are no backup snapshots of the database on the server. It is
        recommended to make backups regularly and store them in other safe places as well.</n-alert>
    </div>

    <n-grid :x-gap="48" :y-gap="16" cols="2 400:4 600:6" style="margin-top:1rem;">
      <n-gi v-for="(item, index) in backups" :key="index" style="text-align:center">
        <n-button v-if="store.hasRights()" :secondary="!item.marked" type="primary" :loading="item.state"
          @click="downloadBackup(index)">{{ item.filename.split('.').shift() }}</n-button>
        <n-tag v-else size="large" type="primary">{{ item.filename.split('.').shift() }}</n-tag>
      </n-gi>
    </n-grid>

    <template #footer>
      <!-- #footer -->
    </template>
    <template #action>
      <!-- #action -->
    </template>
  </n-card>
</template>

<script setup lang="ts">

import { ref, reactive, onBeforeMount } from 'vue';
import { useMessage } from 'naive-ui';
import store from '../store';

interface IBackup {
  filename: string;
  state: boolean;
  marked: boolean;
}

const message = useMessage();
const backups = reactive([] as Array<IBackup>);
const isLoaded = ref(false);
const processing = ref(false);

const makeBackup = async () => {
  processing.value = true;
  const data = await store.post('backup');
  processing.value = false;
  // console.log(data);
  if (data?.error) {
    message.error(`Database backup error: ${data.error}`, { duration: 5000 });
  } else {
    const thisBackup = backups.filter(x => x.filename === data.file);
    if (thisBackup.length) {
      thisBackup[0]["marked"] = true;
      message.warning(`Database snapshot was succsesfully updated! File ${data.file}`, { closable: true });
    } else {
      backups.unshift({ filename: data.file, state: false, marked: true, });
      message.info(`Database snapshot was succsesfully created! File ${data.file}`, { closable: true });
    }
  }
};

const downloadBackup = async (index: number) => {
  const backupInfo = backups[index];
  backupInfo.state = true;
  const result = await store.getFile('backupfile', backupInfo.filename);
  backupInfo.state = false;
  if (result) {
    message.error('Download error!', { duration: 5000 });
  }
};

onBeforeMount(async () => {
  const data = await store.get('backup');
  Object.assign(
    backups,
    data.reverse().map((fn: any) => ({ filename: fn, state: false, marked: false }))
  );
  isLoaded.value = true;
});

</script>
