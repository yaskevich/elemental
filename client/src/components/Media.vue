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
  </n-card>
</template>

<script setup lang="ts">

  import { ref, reactive, onBeforeMount } from 'vue';
  import store from '../store';
  import { ArchiveFilled as ArchiveIcon } from '@vicons/material';
  const isLoaded = ref(true);

</script>
