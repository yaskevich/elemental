<template>

  <div class="center-column">
    <div class="left-column" v-if="isLoaded">

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

      <div style="max-width:300px;">
        <n-alert title="No backups!" type="warning" v-if=!backups.length>
          There are no backup snapshots of the database on the server. <br/>
          It is recommended for data safety to make backups regularly and save them somewhere else.
        </n-alert>
      </div>

      <div v-for="(item, index) in backups" :key="index" style="padding:.5rem;">
        <n-button secondary type="primary" :loading="item.state" @click="downloadBackup(index)">{{item.filename.split('.').shift()}}</n-button>
      </div>

    </div>
  </div>

</template>

<script setup lang="ts">

  import { ref, reactive, onBeforeMount } from 'vue';
  import { useMessage } from 'naive-ui';
  import store from '../store';

  interface IBackup {
     filename: string;
     state: boolean;
   };

  const message = useMessage();
  const backups = reactive([] as Array<IBackup>);
  const isLoaded = ref(false);

  const makeBackup = async () => {
    const data = await store.get('backup');
    // console.log(data);
    if (data?.error) {
      message.error(`Database backup error: ${data.error}`, { duration: 5000 });
    } else {
      if (backups.filter(x => x.filename === data.file).length){
        message.warning(`Database snapshot was succsesfully updated! File ${data.file}`, { closable: true });
      } else {
        backups.unshift({filename: data.file, state: false});
        message.info(`Database snapshot was succsesfully created! File ${data.file}`, { closable: true });
      }
    }
  };

  const downloadBackup = async(index: number) => {
    const backupInfo = backups[index];
    backupInfo.state = true;
    const result = await store.getFile('backupfile', backupInfo.filename);
    backupInfo.state = false;
    if (result) {
      message.error("Download error!", { duration: 5000 });
    }
  };

  onBeforeMount(async () => {
    const data = await store.get('backups');
    Object.assign(backups, data.reverse().map((fn:any) => ({ filename: fn, state: false })));
    isLoaded.value = true;
  });

</script>
