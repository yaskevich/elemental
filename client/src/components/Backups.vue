<template>

  <n-card title="Backups" v-if="isLoaded" :bordered="false" class="minimal left">

    <template #header-extra>
      <n-button type="primary" @click="makeBackup">+ make</n-button>
    </template>

    <div style="margin: 0 auto;">
      <n-alert title="No backups!" type="warning" v-if=!backups.length>
        There are no backup snapshots of the database on the server. It is recommended to make backups regularly and store them in other safe places as well.
      </n-alert>
    </div>

    <n-grid :x-gap="12" :y-gap="8" :cols="backups > 9 ? 3: 1">
      <n-gi v-for="(item, index) in backups" :key="index">
        <n-button secondary type="primary" :loading="item.state" @click="downloadBackup(index)">{{item.filename.split('.').shift()}}</n-button>
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
  }

  const message = useMessage();
  const backups = reactive([] as Array<IBackup>);
  const isLoaded = ref(false);

  const makeBackup = async () => {
    const data = await store.get('backup');
    // console.log(data);
    if (data?.error) {
      message.error(`Database backup error: ${data.error}`, { duration: 5000 });
    } else {
      if (backups.filter(x => x.filename === data.file).length) {
        message.warning(`Database snapshot was succsesfully updated! File ${data.file}`, { closable: true });
      } else {
        backups.unshift({ filename: data.file, state: false });
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
    const data = await store.get('backups');
    Object.assign(
      backups,
      data.reverse().map((fn: any) => ({ filename: fn, state: false }))
    );
    isLoaded.value = true;
  });

</script>
