<template>
  <n-card title="Media management" v-if="isLoaded" :bordered="false" class="minimal left">
    <!-- <n-upload action="/api/upload" @preview="handlePreview">
      <n-upload-dragger>
        <div style="margin-bottom: 12px">
          <n-icon size="48" :depth="3">
            <archive-icon />
          </n-icon>
        </div>
        <n-text style="font-size: 16px">
          Click or drag an image to this area to upload
        </n-text>
        <n-p depth="3" style="margin: 8px 0 0 0">
          Maximum file size is 2MB.
        </n-p>
      </n-upload-dragger>
    </n-upload>
    <n-divider /> -->
    <n-upload
      :action="`/api/upload/${id}`"
      :default-file-list="previewFileList"
      list-type="image-card"
      @remove="handleRemoval"
    />
    <n-modal
      v-model:show="showModal"
      preset="card"
      style="width: 600px"
      title="A Cool Picture"
    >
      <img :src="previewImageUrl" style="width: 100%">
    </n-modal>
  </n-card>
</template>

<script setup lang="ts">

  import { ref, reactive, onBeforeMount } from 'vue';
  import store from '../store';
  import { ArchiveFilled as ArchiveIcon } from '@vicons/material';
  import type { UploadFileInfo } from 'naive-ui';
  // import { useRoute } from 'vue-router';
  // const vuerouter = useRoute();
  // const id = vuerouter.params.id || 1;
  const id = store?.state?.user?.text_id;
  const isLoaded = ref(true);
  const showModal = ref(false);
  const previewImageUrl = ref('');

  const previewFileList = reactive<UploadFileInfo[]>([]);

  // const handlePreview = (file: UploadFileInfo, x) => {
  //     const { url } = file;
  //     console.log("file", file);
  //     previewImageUrl.value = url as string;
  //     showModal.value = true;
  // };

  const handleRemoval = (file: UploadFileInfo, fileList: Array<UploadFileInfo>) => {
    console.log(file)
    return false;
  };

  onBeforeMount(async () => {
    const data = await store.get(`img/${id}`);
    Object.assign(previewFileList, data.sort((a,b) => (new Date(a.stats.mtime)).getTime() - (new Date(b.stats.mtime)).getTime() ));
  });
  
</script>
