<template>
  <n-card title="Media management" v-if="isLoaded" :bordered="false" class="minimal left">
    <n-upload action="/api/upload">
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
    <n-divider />
    <n-upload
      action="https://www.mocky.io/v2/5e4bafc63100007100d8b70f"
      :default-file-list="previewFileList"
      list-type="image-card"
      @preview="handlePreview"
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
  const isLoaded = ref(true);
  const showModal = ref(false);
  const previewImageUrl = ref('');

  const previewFileList = ref<UploadFileInfo[]>([
        {
          id: 'react',
          name: '123.png',
          status: 'finished',
          url: 'api/img/temp.jpeg'
        },
        {
          id: 'vue',
          name: '345.png',
          status: 'finished',
          url: 'api/img/temp.jpeg'
        }
      ]);

  const handlePreview = (file: UploadFileInfo) => {
      const { url } = file;
      previewImageUrl.value = url as string;
      showModal.value = true;
  };

</script>
